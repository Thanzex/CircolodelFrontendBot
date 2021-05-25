FROM node:12-slim AS build
ADD . /app
WORKDIR /app
RUN yarn
RUN yarn build
# CMD yarn start
FROM gcr.io/distroless/nodejs:14
COPY --from=build /app /app
WORKDIR /app
CMD ["."]