import net from "node:net";
import dns from "node:dns";

// Some networks (observed on certain sandboxed/dev hosts) fail Node's
// default parallel IPv4+IPv6 "happy eyeballs" connection attempt to Neon's
// hostnames, even though a single IPv4 connection succeeds. Preferring IPv4
// and attempting addresses sequentially avoids that without hardcoding any
// IP — harmless on networks where the default already works fine.
net.setDefaultAutoSelectFamily(false);
dns.setDefaultResultOrder("ipv4first");
