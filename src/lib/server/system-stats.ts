import { createServerFn } from "@tanstack/react-start";
import { execSync } from "child_process";
import os from "os";

export type NetworkInterface = {
  name: string;
  bytesIn: number;
  bytesOut: number;
  speed?: number; // Mbps
  isUp: boolean;
};

export type CpuTemperature = {
  label: string;
  value: number; // Celsius
};

export type TopProcess = {
  pid: number;
  name: string;
  cpu: number; // percentage
  memory: number; // percentage
};

export type SystemStats = {
  cpu: {
    usage: number; // percentage 0-100
    cores: number;
    temperature?: number; // Celsius
  };
  ram: {
    used: number; // bytes
    total: number; // bytes
    usage: number; // percentage 0-100
  };
  disks: Array<{
    mount: string;
    filesystem: string;
    used: number; // bytes
    total: number; // bytes
    usage: number; // percentage 0-100
  }>;
  network?: NetworkInterface[];
  temperatures?: CpuTemperature[];
  processes?: TopProcess[];
  hostname: string;
};

// Store previous CPU times for calculating usage
let previousCpuTimes: { idle: number; total: number } | null = null;

function getCpuUsage(): number {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;

  for (const cpu of cpus) {
    idle += cpu.times.idle;
    total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
  }

  if (!previousCpuTimes) {
    previousCpuTimes = { idle, total };
    // Return a rough estimate for first call
    return Math.round((1 - idle / total) * 100);
  }

  const idleDiff = idle - previousCpuTimes.idle;
  const totalDiff = total - previousCpuTimes.total;

  previousCpuTimes = { idle, total };

  if (totalDiff === 0) return 0;

  const usage = Math.round((1 - idleDiff / totalDiff) * 100);
  return Math.max(0, Math.min(100, usage));
}

function parseSize(sizeStr: string): number {
  const match = sizeStr.match(/^([\d.]+)([KMGTP]?)$/i);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  const multipliers: Record<string, number> = {
    "": 1024, // df outputs in 1K blocks by default
    K: 1024,
    M: 1024 * 1024,
    G: 1024 * 1024 * 1024,
    T: 1024 * 1024 * 1024 * 1024,
    P: 1024 * 1024 * 1024 * 1024 * 1024,
  };

  return value * (multipliers[unit] || 1);
}

function getDiskUsage(): SystemStats["disks"] {
  try {
    // Use df with specific output format
    const output = execSync("df -BG --output=source,target,size,used,avail,pcent 2>/dev/null || df -h 2>/dev/null", {
      encoding: "utf-8",
      timeout: 5000,
    });

    const lines = output.trim().split("\n").slice(1); // Skip header
    const disks: SystemStats["disks"] = [];

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 5) continue;

      // Skip virtual filesystems
      const filesystem = parts[0];
      if (
        filesystem.startsWith("tmpfs") ||
        filesystem.startsWith("devtmpfs") ||
        filesystem.startsWith("overlay") ||
        filesystem === "none" ||
        filesystem.startsWith("shm")
      ) {
        continue;
      }

      // Check if it's the --output format or traditional df -h format
      let mount: string;
      let total: number;
      let used: number;
      let usage: number;

      if (parts.length >= 6 && parts[5].endsWith("%")) {
        // --output format: source target size used avail pcent
        mount = parts[1];
        total = parseSize(parts[2]);
        used = parseSize(parts[3]);
        usage = parseInt(parts[5].replace("%", "")) || 0;
      } else {
        // Traditional df -h format: Filesystem Size Used Avail Use% Mounted
        mount = parts[parts.length - 1];
        total = parseSize(parts[1]);
        used = parseSize(parts[2]);
        usage = parseInt(parts[4].replace("%", "")) || 0;
      }

      // Only include real mount points
      if (mount.startsWith("/") && !mount.startsWith("/boot") && !mount.startsWith("/snap")) {
        disks.push({
          mount,
          filesystem,
          used,
          total,
          usage,
        });
      }
    }

    // Sort by mount point, root first
    disks.sort((a, b) => {
      if (a.mount === "/") return -1;
      if (b.mount === "/") return 1;
      return a.mount.localeCompare(b.mount);
    });

    return disks;
  } catch (error) {
    console.error("Failed to get disk usage:", error);
    return [];
  }
}

function getNetworkStats(): NetworkInterface[] {
  try {
    const interfaces = os.networkInterfaces();
    const result: NetworkInterface[] = [];

    // Read /proc/net/dev for byte counts on Linux
    let netDevData: Record<string, { bytesIn: number; bytesOut: number }> = {};
    try {
      const output = execSync("cat /proc/net/dev 2>/dev/null", {
        encoding: "utf-8",
        timeout: 2000,
      });
      const lines = output.trim().split("\n").slice(2); // Skip headers
      for (const line of lines) {
        const parts = line.trim().split(/[:\s]+/);
        if (parts.length >= 10) {
          const name = parts[0];
          netDevData[name] = {
            bytesIn: parseInt(parts[1]) || 0,
            bytesOut: parseInt(parts[9]) || 0,
          };
        }
      }
    } catch {
      // /proc/net/dev not available (non-Linux)
    }

    for (const [name, addrs] of Object.entries(interfaces)) {
      if (!addrs || name === "lo") continue;

      const isUp = addrs.some((a) => !a.internal);
      const stats = netDevData[name] || { bytesIn: 0, bytesOut: 0 };

      result.push({
        name,
        bytesIn: stats.bytesIn,
        bytesOut: stats.bytesOut,
        isUp,
      });
    }

    return result;
  } catch (error) {
    console.error("Failed to get network stats:", error);
    return [];
  }
}

function getTemperatures(): CpuTemperature[] {
  const temps: CpuTemperature[] = [];

  try {
    // Try reading from /sys/class/thermal on Linux
    const output = execSync(
      "cat /sys/class/thermal/thermal_zone*/temp 2>/dev/null | head -5",
      { encoding: "utf-8", timeout: 2000 }
    );
    const lines = output.trim().split("\n");
    lines.forEach((line, i) => {
      const temp = parseInt(line) / 1000; // Convert millidegrees to degrees
      if (!isNaN(temp) && temp > 0 && temp < 150) {
        temps.push({
          label: i === 0 ? "CPU" : `Zone ${i}`,
          value: Math.round(temp),
        });
      }
    });
  } catch {
    // Thermal zones not available
  }

  // Try sensors command as fallback
  if (temps.length === 0) {
    try {
      const output = execSync("sensors 2>/dev/null | grep -E '^(Core|CPU|temp)' | head -5", {
        encoding: "utf-8",
        timeout: 3000,
      });
      const lines = output.trim().split("\n");
      for (const line of lines) {
        const match = line.match(/([^:]+):\s*\+?([\d.]+)°C/);
        if (match) {
          temps.push({
            label: match[1].trim(),
            value: Math.round(parseFloat(match[2])),
          });
        }
      }
    } catch {
      // sensors command not available
    }
  }

  return temps;
}

function getTopProcesses(): TopProcess[] {
  try {
    // Get top 5 processes by CPU usage
    const output = execSync(
      "ps -eo pid,comm,%cpu,%mem --sort=-%cpu 2>/dev/null | head -6",
      { encoding: "utf-8", timeout: 3000 }
    );
    const lines = output.trim().split("\n").slice(1); // Skip header
    const processes: TopProcess[] = [];

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        processes.push({
          pid: parseInt(parts[0]) || 0,
          name: parts[1],
          cpu: parseFloat(parts[2]) || 0,
          memory: parseFloat(parts[3]) || 0,
        });
      }
    }

    return processes;
  } catch (error) {
    console.error("Failed to get top processes:", error);
    return [];
  }
}

// Get local system stats
export const getLocalSystemStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<SystemStats> => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const temperatures = getTemperatures();
    const cpuTemp = temperatures.find((t) => t.label === "CPU" || t.label.startsWith("Core"));

    return {
      cpu: {
        usage: getCpuUsage(),
        cores: os.cpus().length,
        temperature: cpuTemp?.value,
      },
      ram: {
        used: usedMem,
        total: totalMem,
        usage: Math.round((usedMem / totalMem) * 100),
      },
      disks: getDiskUsage(),
      network: getNetworkStats(),
      temperatures,
      processes: getTopProcesses(),
      hostname: os.hostname(),
    };
  }
);

// Get stats from a Glances server
export const getGlancesStats = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { url: string; apiKey?: string } }): Promise<SystemStats> => {
    const { url, apiKey } = ctx.data;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["X-Api-Key"] = apiKey;
    }

    try {
      // Fetch all stats at once
      const response = await fetch(`${url}/api/3/all`, {
        headers,
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`Glances API error: ${response.status}`);
      }

      const data = await response.json();

      // Parse CPU
      const cpuUsage = data.cpu?.total || data.quicklook?.cpu || 0;
      const cpuCores = data.cpu?.cpucore || data.system?.core || 1;

      // Parse RAM
      const memTotal = data.mem?.total || 0;
      const memUsed = data.mem?.used || 0;
      const memPercent = data.mem?.percent || 0;

      // Parse Disks
      const disks: SystemStats["disks"] = [];
      if (data.fs && Array.isArray(data.fs)) {
        for (const fs of data.fs) {
          if (fs.mnt_point && !fs.mnt_point.startsWith("/boot") && !fs.mnt_point.startsWith("/snap")) {
            disks.push({
              mount: fs.mnt_point,
              filesystem: fs.device_name || fs.fs_type || "unknown",
              used: fs.used || 0,
              total: fs.size || 0,
              usage: fs.percent || 0,
            });
          }
        }
      }

      // Parse Network interfaces
      const network: NetworkInterface[] = [];
      if (data.network && Array.isArray(data.network)) {
        for (const iface of data.network) {
          if (iface.interface_name && iface.interface_name !== "lo") {
            network.push({
              name: iface.interface_name,
              bytesIn: iface.cumulative_rx || 0,
              bytesOut: iface.cumulative_tx || 0,
              speed: iface.speed ? iface.speed / 1000000 : undefined, // Convert to Mbps
              isUp: iface.is_up ?? true,
            });
          }
        }
      }

      // Parse Temperatures
      const temperatures: CpuTemperature[] = [];
      if (data.sensors && Array.isArray(data.sensors)) {
        for (const sensor of data.sensors) {
          if (sensor.label && sensor.value !== undefined) {
            temperatures.push({
              label: sensor.label,
              value: Math.round(sensor.value),
            });
          }
        }
      }

      // Parse CPU temperature from quicklook if available
      let cpuTemp: number | undefined;
      if (temperatures.length > 0) {
        const cpuSensor = temperatures.find((t) =>
          t.label.toLowerCase().includes("cpu") || t.label.startsWith("Core")
        );
        cpuTemp = cpuSensor?.value;
      }

      // Parse Top Processes
      const processes: TopProcess[] = [];
      if (data.processlist && Array.isArray(data.processlist)) {
        const sorted = [...data.processlist]
          .sort((a, b) => (b.cpu_percent || 0) - (a.cpu_percent || 0))
          .slice(0, 5);
        for (const proc of sorted) {
          processes.push({
            pid: proc.pid || 0,
            name: proc.name || "unknown",
            cpu: Math.round((proc.cpu_percent || 0) * 10) / 10,
            memory: Math.round((proc.memory_percent || 0) * 10) / 10,
          });
        }
      }

      return {
        cpu: {
          usage: Math.round(cpuUsage),
          cores: cpuCores,
          temperature: cpuTemp,
        },
        ram: {
          used: memUsed,
          total: memTotal,
          usage: Math.round(memPercent),
        },
        disks,
        network,
        temperatures,
        processes,
        hostname: data.system?.hostname || "Unknown",
      };
    } catch (error) {
      console.error("Failed to fetch Glances stats:", error);
      throw new Error(
        `Failed to connect to Glances: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
);
