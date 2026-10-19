# Build context is the extracted release tarball (build/, node_modules/, package.json),
# not the repo: the image carries exactly the tested artifact.
FROM node:22-slim

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATABASE_PATH=/data/life-manager.db

WORKDIR /app
COPY --chown=node:node . .

# node:22-slim ships an unprivileged `node` user (uid 1000)
RUN mkdir /data && chown node:node /data
USER node

VOLUME /data
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s \
    CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/healthz').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"

CMD ["node", "build"]
