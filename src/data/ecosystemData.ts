/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EcosystemGlossaryItem } from '../types';

export const ECOSYSTEM_GLOSSARY: EcosystemGlossaryItem[] = [
  {
    id: 'reverse-proxy',
    category: 'Directives',
    title: 'reverse_proxy',
    tag: 'Core Routing',
    summary: 'Proxies requests to one or more upstreams with dynamic health checks, passive failure detection, and load balancing.',
    syntax: 'reverse_proxy [<matcher>] <to...> {\n  lb_policy <name>\n  health_uri <path>\n  health_interval <duration>\n  header_up Host {upstream_hostport}\n}',
    caddyfileExample: `example.com {
    reverse_proxy /api/* 127.0.0.1:8080 127.0.0.1:8081 {
        lb_policy least_conn
        health_uri /healthz
        health_interval 5s
        health_timeout 2s
        max_fails 3
    }
    
    # Static SPA frontend fallback
    root * /var/www/dist
    file_server
    try_files {path} /index.html
}`,
    proTip: 'Use {http.reverse_proxy.upstream.address} in access logs to trace which internal microservice node handled each request.',
    officialDocUrl: 'https://caddyserver.com/docs/caddyfile/directives/reverse_proxy'
  },
  {
    id: 'tls-directive',
    category: 'ACME & TLS',
    title: 'tls',
    tag: 'Auto HTTPS',
    summary: 'Customizes automated TLS certificate acquisition, internal zero-trust CA certificates, or external certificates.',
    syntax: 'tls [<email> | internal | <cert_file> <key_file>] {\n  protocols <min> [<max>]\n  ciphers <cipher_suites...>\n  dns <provider_name> <api_token>\n}',
    caddyfileExample: `secure.company.internal {
    # Issue zero-trust locally trusted root cert
    tls internal

    # Or use Let's Encrypt with Cloudflare DNS-01 challenge for wildcards
    # tls admin@company.com {
    #     dns cloudflare {env.CF_API_TOKEN}
    #     protocols tls1.3
    # }

    reverse_proxy 10.0.0.45:443 {
        transport http {
            tls_insecure_skip_verify
        }
    }
}`,
    proTip: 'Setting "protocols tls1.3" disables TLS 1.2 and mitigates downgrade attacks, ensuring strict forward secrecy.',
    officialDocUrl: 'https://caddyserver.com/docs/caddyfile/directives/tls'
  },
  {
    id: 'rate-limit-module',
    category: 'Cyber Security',
    title: 'rate_limit',
    tag: 'DDoS Shield',
    summary: 'Restricts client request velocity based on IP address, cookie, or API key using a high-performance token-bucket algorithm.',
    syntax: 'rate_limit { \n  zone <name> {\n    key {remote_host}\n    events <count>\n    window <duration>\n  }\n}',
    caddyfileExample: `api.example.com {
    rate_limit {
        # General API protection: 100 requests per minute
        zone api_burst {
            key {remote_host}
            events 100
            window 1m
        }
        # Strict login endpoint brute-force protection
        zone auth_limit {
            match {
                path /api/v1/auth/*
            }
            key {remote_host}
            events 5
            window 1m
        }
    }

    reverse_proxy localhost:5000
}`,
    proTip: 'Combine rate limiting with custom 429 Retry-After headers to prevent mobile clients from hitting retry death spirals.',
    officialDocUrl: 'https://github.com/mholt/caddy-ratelimit'
  },
  {
    id: 'waf-coraza',
    category: 'Cyber Security',
    title: 'coraza_waf',
    tag: 'Enterprise WAF',
    summary: 'Embeds the OWASP Core Rule Set (CRS) into Caddy to stop SQL Injection, XSS, SSRF, and Remote Code Execution before reaching your apps.',
    syntax: 'coraza_waf {\n  directives_file /etc/caddy/coraza.conf\n  include @owasp_crs/*.conf\n}',
    caddyfileExample: `portal.defence.gov {
    coraza_waf {
        directives "
            SecRuleEngine On
            SecRequestBodyAccess On
            SecRule REQUEST_HEADERS:User-Agent \"(sqlmap|nikto|acunetix)\" \"id:1001,phase:1,deny,status:403,msg:'Malicious Scanner Detected'\"
            SecAction \"id:900000,phase:1,pass,t:none,setvar:tx.paranoia_level=2\"
        "
    }

    # Strict Security Headers
    header {
        Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
        X-Frame-Options "DENY"
        X-Content-Type-Options "nosniff"
        Content-Security-Policy "default-src 'self'; script-src 'self'; object-src 'none';"
    }

    reverse_proxy backend-cluster:8000
}`,
    proTip: 'Start with SecRuleEngine DetectionOnly in staging to test for false positives before flipping to On in production.',
    officialDocUrl: 'https://github.com/corazawaf/coraza-caddy'
  },
  {
    id: 'encode-directive',
    category: 'Directives',
    title: 'encode',
    tag: 'Performance',
    summary: 'Compresses outgoing HTTP responses using modern algorithms like Zstandard (zstd) and Gzip dynamically.',
    syntax: 'encode [zstd] [gzip]',
    caddyfileExample: `cdn.example.com {
    root * /data/assets
    
    # Modern zstd compresses up to 25% tighter than gzip with lower CPU overhead
    encode zstd gzip {
        minimum_length 512
        match {
            header Content-Type text/*
            header Content-Type application/json*
            header Content-Type application/javascript*
        }
    }

    file_server
}`,
    proTip: 'Zstandard (zstd) is supported out of the box in Chrome, Firefox, and Edge, saving massive bandwidth on API payloads.',
    officialDocUrl: 'https://caddyserver.com/docs/caddyfile/directives/encode'
  },
  {
    id: 'security-headers',
    category: 'Cyber Security',
    title: 'Security Headers Suite',
    tag: 'Hardening',
    summary: 'Enforces HSTS, Content-Security-Policy, Permissions-Policy, and anti-clickjacking to achieve an A+ Mozilla Observatory security rating.',
    syntax: 'header {\n  Strict-Transport-Security "..."\n  X-Frame-Options "..."\n  ...\n}',
    caddyfileExample: `secure.app.io {
    header {
        # Enforce HTTPS across all subdomains and submit to HSTS Preload list
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        # Prevent MIME type sniffing
        X-Content-Type-Options "nosniff"
        # Prevent clickjacking
        X-Frame-Options "DENY"
        # Protect referrer leakage
        Referrer-Policy "strict-origin-when-cross-origin"
        # Disable unwanted browser hardware APIs
        Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"
        # Hide Caddy/Server signature
        -Server
    }
    reverse_proxy localhost:3000
}`,
    proTip: 'The "-Server" directive strips the server banner header, keeping reconnaissance bots from probing specific version flaws.',
    officialDocUrl: 'https://caddyserver.com/docs/caddyfile/directives/header'
  },
  {
    id: 'zero-downtime-reload',
    category: 'Core Concepts',
    title: 'Zero-Downtime Reload',
    tag: 'Operations',
    summary: 'Caddy swaps its entire configuration atomically in-memory via the Admin API without dropping a single active client TCP socket.',
    syntax: 'caddy reload --config /etc/caddy/Caddyfile\n# Or via Admin REST API:\nPOST http://localhost:2019/load',
    caddyfileExample: `# Trigger instant reload via curl or CI/CD webhook:
# curl -i -X POST http://localhost:2019/load \\
#      -H "Content-Type: text/caddyfile" \\
#      --data-binary @Caddyfile

{
    admin localhost:2019
    auto_https disable_redirects # optional customization
}`,
    proTip: 'If the new configuration contains any syntax or socket binding errors, Caddy rolls back immediately without disruption.',
    officialDocUrl: 'https://caddyserver.com/docs/api'
  },
  {
    id: 'arch-microservices',
    category: 'Architectures',
    title: 'Next.js + FastAPI + Postgres Architecture',
    tag: 'Fullstack Recipe',
    summary: 'Battle-tested blueprint routing client traffic to Next.js frontend, Python FastAPI backend, WebSocket streams, and static media.',
    syntax: 'Caddyfile Multi-Tier Architecture',
    caddyfileExample: `hub.acme.corp {
    # 1. Frontend Next.js SSR & Static Assets
    handle_path /_next/* {
        reverse_proxy frontend:3000
    }

    # 2. REST API with Gzip/Zstd compression
    handle /api/* {
        reverse_proxy backend-api:8000 {
            header_up X-Real-IP {remote_host}
            header_up X-Forwarded-Proto https
        }
    }

    # 3. WebSockets for real-time notifications
    handle /ws/* {
        reverse_proxy ws-server:8080 {
            # WebSockets are automatically supported in Caddy v2
        }
    }

    # 4. Default frontend fallback
    handle {
        reverse_proxy frontend:3000
    }
}`,
    proTip: 'In Caddy v2, WebSockets work automatically without needing manual "Upgrade" or "Connection" headers.',
    officialDocUrl: 'https://caddyserver.com/docs/caddyfile/patterns'
  },
  {
    id: 'quic-http3',
    category: 'Core Concepts',
    title: 'HTTP/3 (QUIC) Protocol',
    tag: 'Next-Gen Protocol',
    summary: 'Caddy provides native, automatic HTTP/3 over UDP with zero configuration, cutting mobile latency by eliminating head-of-line blocking.',
    syntax: 'Automatic when TLS is enabled.\nListen ports: 443/tcp AND 443/udp',
    caddyfileExample: `app.mobilefirst.com {
    # HTTP/3 is active by default in Caddy v2!
    # Ensure UDP port 443 is open in your cloud firewall (AWS SG / GCP Firewall)
    
    reverse_proxy app-node:4000
}`,
    proTip: 'Always verify UDP port 443 is unblocked in your host firewall; otherwise clients fall back to TCP HTTP/2.',
    officialDocUrl: 'https://caddyserver.com/docs/caddyfile/options#servers'
  },
  {
    id: 'bad-bot-defense',
    category: 'Cyber Security',
    title: 'Bot Defense & Crawler Blocking',
    tag: 'Threat Blocker',
    summary: 'Filters scrapers, AI training harvesters, vulnerability scanner spiders, and abusive user agents instantly.',
    syntax: '@bad_bots header_regexp User-Agent "(?i)(SemrushBot|AhrefsBot|MJ12bot|DotBot|PetalBot|bytespider|GPTBot)"\nhandle @bad_bots {\n    respond "Access Denied by Security Policy" 403\n}',
    caddyfileExample: `store.com {
    # Match unauthorized scrapers
    @unauthorized_bots {
        header_regexp User-Agent "(?i)(GPTBot|CCBot|anthropic-ai|ClaudeBot|Bytespider|SemrushBot)"
    }
    handle @unauthorized_bots {
        respond "Access Restricted - Automated AI Scraper Blocked" 403 {
            close
        }
    }

    reverse_proxy localhost:8080
}`,
    proTip: 'The "close" subdirective forcefully drops the connection immediately, minimizing server memory and socket consumption.',
    officialDocUrl: 'https://caddyserver.com/docs/caddyfile/matchers'
  }
];
