// Icon mappings for common homelab applications
// Uses dashboard-icons from https://github.com/walkxcode/dashboard-icons

const ICON_BASE_URL = "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png";

// Map of normalized app names to icon filenames
const iconMappings: Record<string, string> = {
  // Media
  plex: "plex.png",
  jellyfin: "jellyfin.png",
  emby: "emby.png",
  kodi: "kodi.png",
  stremio: "stremio.png",
  infuse: "infuse.png",

  // Media Management
  sonarr: "sonarr.png",
  radarr: "radarr.png",
  lidarr: "lidarr.png",
  readarr: "readarr.png",
  prowlarr: "prowlarr.png",
  bazarr: "bazarr.png",
  overseerr: "overseerr.png",
  ombi: "ombi.png",
  requestrr: "requestrr.png",
  tautulli: "tautulli.png",
  petio: "petio.png",

  // Download Clients
  qbittorrent: "qbittorrent.png",
  transmission: "transmission.png",
  deluge: "deluge.png",
  rtorrent: "rtorrent.png",
  sabnzbd: "sabnzbd.png",
  nzbget: "nzbget.png",
  jdownloader: "jdownloader.png",

  // Containers & Orchestration
  docker: "docker.png",
  portainer: "portainer.png",
  kubernetes: "kubernetes.png",
  rancher: "rancher.png",
  watchtower: "watchtower.png",
  yacht: "yacht.png",

  // Networking
  traefik: "traefik.png",
  nginx: "nginx.png",
  caddy: "caddy.png",
  haproxy: "haproxy.png",
  pihole: "pi-hole.png",
  adguard: "adguard-home.png",
  adguardhome: "adguard-home.png",
  unbound: "unbound.png",
  wireguard: "wireguard.png",
  tailscale: "tailscale.png",
  zerotier: "zerotier.png",
  cloudflare: "cloudflare.png",
  cloudflared: "cloudflare.png",

  // Monitoring
  grafana: "grafana.png",
  prometheus: "prometheus.png",
  influxdb: "influxdb.png",
  uptimekuma: "uptime-kuma.png",
  glances: "glances.png",
  netdata: "netdata.png",
  zabbix: "zabbix.png",

  // Home Automation
  homeassistant: "home-assistant.png",
  nodered: "node-red.png",
  mosquitto: "mosquitto.png",
  zigbee2mqtt: "zigbee2mqtt.png",
  zwavejs: "zwave-js-ui.png",

  // Storage & Files
  nextcloud: "nextcloud.png",
  syncthing: "syncthing.png",
  filebrowser: "filebrowser.png",
  duplicati: "duplicati.png",
  restic: "restic.png",
  minio: "minio.png",
  photoprism: "photoprism.png",
  immich: "immich.png",
  librephotos: "librephotos.png",

  // Productivity
  vaultwarden: "vaultwarden.png",
  bitwarden: "bitwarden.png",
  bookstack: "bookstack.png",
  wikijs: "wiki-js.png",
  outline: "outline.png",
  gitea: "gitea.png",
  gitlab: "gitlab.png",
  drone: "drone.png",
  jenkins: "jenkins.png",

  // Databases
  postgres: "postgresql.png",
  postgresql: "postgresql.png",
  mysql: "mysql.png",
  mariadb: "mariadb.png",
  mongodb: "mongodb.png",
  redis: "redis.png",
  elasticsearch: "elasticsearch.png",

  // Communication
  matrix: "matrix.png",
  synapse: "matrix.png",
  mattermost: "mattermost.png",
  rocketchat: "rocket-chat.png",
  discord: "discord.png",

  // Games
  minecraft: "minecraft.png",
  valheim: "valheim.png",

  // Utilities
  homarr: "homarr.png",
  homepage: "homepage.png",
  dashy: "dashy.png",
  heimdall: "heimdall.png",
  organizr: "organizr.png",
  flame: "flame.png",
  speedtest: "speedtest-tracker.png",
  changedetection: "changedetection-io.png",
  ntfy: "ntfy.png",
  gotify: "gotify.png",
  authelia: "authelia.png",
  authentik: "authentik.png",

  // TrueNAS specific
  truenas: "truenas.png",
  truenasscale: "truenas-scale.png",
  synology: "synology.png",
  unraid: "unraid.png",
};

// Normalize name for lookup
function normalizeLookupName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[-_\s]/g, "")
    .replace(/\d+$/, "") // Remove trailing version numbers
    .trim();
}

/**
 * Get icon URL for a given app/container name
 * Returns null if no matching icon is found
 */
export function getIconUrl(name: string): string | null {
  const normalized = normalizeLookupName(name);

  // Direct match
  if (iconMappings[normalized]) {
    return `${ICON_BASE_URL}/${iconMappings[normalized]}`;
  }

  // Partial match - check if any key is contained in the name
  for (const [key, icon] of Object.entries(iconMappings)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return `${ICON_BASE_URL}/${icon}`;
    }
  }

  return null;
}

/**
 * Get icon URL with fallback to a default
 */
export function getIconUrlWithFallback(name: string, fallbackUrl?: string): string {
  const iconUrl = getIconUrl(name);
  if (iconUrl) return iconUrl;

  // If no specific icon found, return fallback or a generic icon
  return fallbackUrl || `${ICON_BASE_URL}/docker.png`;
}

/**
 * Check if we have an icon for this app name
 */
export function hasIcon(name: string): boolean {
  return getIconUrl(name) !== null;
}
