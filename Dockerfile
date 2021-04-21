FROM node:12-slim AS build
ADD . /app
WORKDIR /app
RUN yarn
# CMD yarn start
FROM gcr.io/distroless/nodejs:12
COPY --from=build /app /app
WORKDIR /app
CMD ["."]