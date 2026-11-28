# syntax=docker/dockerfile:1@sha256:572cebbc2b15e6f84c077742952674889cb63cd5e9b80abdffcbe587b6f19183

# Images pinned by digest (update the tag and the digest together).
FROM node:24.22.3-alpine3.24@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5 AS build
WORKDIR /src

# Same version as "packageManager" in package.json.
RUN npm install --global --ignore-scripts pnpm@12.23.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
# No VITE_API_BASE_URL / VITE_WS_BASE_URL: the API is served from the same origin (/api, /ws).
RUN pnpm build

# Static files only: nginx without root, listening on 8080.
FROM nginxinc/nginx-unprivileged:1.30.6-alpine3.24@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.inc /etc/nginx/security-headers.inc
COPY --from=build /src/dist /usr/share/nginx/html
EXPOSE 8080
