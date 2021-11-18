# morphus 🖼

A lightweight image resizing and effect proxy that caches image transformations.
The heavy lifting is done by [`libvips`](https://github.com/libvips/libvips) and [`sharp`](https://github.com/lovell/sharp)

## 🌈 Features

- Config driven
- Domain protection
- Host verification
- Multiple storage adapters (Local, Minio, S3)
- Caniuse based automatic formatting
- ETag caching

## 🏗 Installation

The easies way to run is using docker

```yaml
allowedDomains:
  - !regexp ^https?:\/\/images.unsplash.com
```

```yaml
version: '3.8'

services:
  app:
    image: cupcakearmy/morphus
    ports:
      - '80:80'
```

```bash
docker-compose up
```

## 💻 Usage

###### Example

```html
<img
  url="https://my-morphus.org/api/image?url=https://images.unsplash.com/photo-1636839270984-1f7cbc2b4c4b?format=webp&resize=contain&width=800"
/>
```

| Parameter | Syntax                                                         | Example                                                    |
| --------- | -------------------------------------------------------------- | ---------------------------------------------------------- |
| url       | URL                                                            | `?url=https://cdn.example.org/dog-full-res.png`            |
| format    | ComplexParameter                                               | `?format=webp` `?format=webp\|quality:90,progressive:true` |
| resize    | [sharp.fit](https://sharp.pixelplumbing.com/api-resize#resize) | `?resize=contain`                                          |
| width     | number                                                         | `?width=500`                                               |
| height    | number                                                         | `?width=500`                                               |
| op        | ComplexParameter[]                                             | `?op=rotate\|angle:90&op=sharpen\|sigma:1,flat:2`          |

### ComplexParameter

The syntax for the `ComplexParameter` is as follows:

###### Without options

```
?param=<name>
```

###### With two options

```
?param=<name>|optionA:1,optionB:true
```

## ⚙️ Configuration

Config files are searched in the current working directory under `morphus.yaml`.

Configuration can be done either thorough config files or env variables. The usage of a config file is recommended. Below is a table of available configuration options, for more details see below.

| Config           | Environment      | Default    | Description                                                                            |
| ---------------- | ---------------- | ---------- | -------------------------------------------------------------------------------------- |
| `port`           | `PORT`           | 80         | The port to bind                                                                       |
| `address`        | `ADDRESS`        | 127.0.0.1  | The address to bind                                                                    |
| `allowedDomains` | `ALLOWED_DOMAIN` | null       | The domains that are allowed to be used as image sources                               |
| `allowedHosts`   | `ALLOWED_HOSTS`  | null       | The hosts that are allowed to access the images                                        |
| `cleanUrls`      | `CLEAN_URL`      | Fragment   | Whether source URLs are cleaned                                                        |
| `maxAge`         | `MAX_AGE`        | 1d         | How long the served images are marked as cached, after that ETag is used to revalidate |
| `storage`        | `STORAGE`        | Local      | The storage driver to use                                                              |
| `local_assets`   | `LOCAL_ASSETS`   | `./assets` | Directory where the local storage driver persists files                                |

### Allowed Domains

Allowed domains are a way to secure the service by only allowing certain remote domains as possible sources of images.

You can provide a `string` which will match as prefix or `RegExp` that allow for more powerful control.

If omitted every domain is allowed.

```yaml
allowedDomains:
  # This will match any URL that starts with the string.
  - https://my.cloud.org

  # For regexp you need to add the !regexp tag in from of it.
  - !regexp ^https?:\/\/images.unsplash.com
```

### Allowed Hosts

Same syntax as for allowed domains.

Allowed hosts enables you to whitelist a number of `origins`.

If ommtted any origin is allowed.

```yaml
allowedHosts:
  - https://my.cloud.org
```

###### Note

When using the url in an `<img>` tag you need to add the `<img crossorigin="anonymous">` attribute to enable sending the `origin` header to the server. Read more [here](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-crossorigin)

## Clean URLs

This option allows cleaning the source URLs to remove duplicates. allowed options are `off`, `fragment`, `query`.

###### Example

| Type       | URL                                                                             |
| ---------- | ------------------------------------------------------------------------------- |
| Original   | `https://images.unsplash.com/photo-1636839270984-1f7cbc2b4c4b?lang=en#chapter1` |
| `off`      | `https://images.unsplash.com/photo-1636839270984-1f7cbc2b4c4b?lang=en#chapter1` |
| `fragment` | `https://images.unsplash.com/photo-1636839270984-1f7cbc2b4c4b?lang=en`          |
| `query`    | `https://images.unsplash.com/photo-1636839270984-1f7cbc2b4c4b`                  |
