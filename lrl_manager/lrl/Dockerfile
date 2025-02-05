FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

#RUN npm uninstall -g corepack
RUN npm install -g corepack@latest
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run -r build
RUN pnpm deploy --filter=frontend --prod /prod/frontend 
RUN pnpm deploy --filter=backend --prod /prod/backend
RUN pnpm deploy --filter=dummycontract --prod /prod/dummycontract

FROM base AS frontend
COPY --from=build /prod/frontend /prod/frontend
WORKDIR /prod/frontend
EXPOSE 3000
CMD [ "pnpm", "start" ]

FROM base AS backend
COPY --from=build /prod/backend /prod/backend
WORKDIR /prod/backend
RUN mkdir ./keys
RUN mkdir ./tmp
EXPOSE 8500
CMD [ "pnpm", "start" ]

FROM base AS dummycontract
COPY --from=build /prod/dummycontract /prod/dummycontract
WORKDIR /prod/dummycontract
EXPOSE 8080
CMD [ "pnpm", "start" ]