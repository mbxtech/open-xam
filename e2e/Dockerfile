FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install NodeJs 22.x
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs

# Install Systembinaries required for Tauri and WebdriverIO tests
RUN apt-get update && apt-get install -y \
        wget \
        git \
        build-essential \
        pkg-config \
        libssl-dev \
        libglib2.0-dev \
        libgtk-3-dev \
        libwebkit2gtk-4.1-dev \
        libayatana-appindicator3-dev \
        librsvg2-dev \
        xvfb \
    webkit2gtk-driver \
    iproute2 \
    && rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
# Setting Path to PKG required by Tauri dependencies
ENV PKG_CONFIG_PATH="/usr/lib/pkgconfig:/usr/share/pkgconfig:/usr/lib/aarch64-linux-gnu/pkgconfig"

RUN cargo install tauri-driver

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

COPY ../ ./

RUN npm run tauri build -- --debug --no-bundle

COPY ./e2e /app/e2e/
WORKDIR /app/e2e

RUN mkdir -p /app/e2e/artifacts/screenshots /app/e2e/artifacts/logs

RUN npm install

CMD ["npm", "test"]