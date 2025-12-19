import { createServerFn } from "@tanstack/react-start";
import { execSync } from "child_process";
import os from "os";

export type SystemStats = {
  cpu: {
    usage: number; // percentage 0-100
    cores: number;
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

// Get local system stats
export const getLocalSystemStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<SystemStats> => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      cpu: {
        usage: getCpuUsage(),
        cores: os.cpus().length,
      },
      ram: {
        used: usedMem,
        total: totalMem,
        usage: Math.round((usedMem / totalMem) * 100),
      },
      disks: getDiskUsage(),
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

      return {
        cpu: {
          usage: Math.round(cpuUsage),
          cores: cpuCores,
        },
        ram: {
          used: memUsed,
          total: memTotal,
          usage: Math.round(memPercent),
        },
        disks,
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
