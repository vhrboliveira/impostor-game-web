# Headers a <meta> Content Security Policy cannot carry (README.md, "Hosting"). Included in every
# location: nginx drops the add_header of outer levels as soon as a location has its own.
add_header Content-Security-Policy "frame-ancestors 'none'" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer" always;
add_header Permissions-Policy "camera=(self), microphone=(), geolocation=()" always;
