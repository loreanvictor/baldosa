# 🚀 publisher

A service that publishes requested tiles with given metadata. It also generates tile bitmaps for each region of published tiles, so clients can easily deduce which tiles to request from the CDN.

## Usage

1. A tile is submitted first. This is an image plus some metadata (title, description, link). The submission is handled by other services, for publisher it is important that the image is stored in a predefined S3 bucket.
2. Another service (for example, an auction service) requests a given URL in the submissions bucket, alongside provided metadata, to be published to a specific position (x,y) on the baldosa grid.
3. The publisher fetches the image, crops it and produces various sizes and blur levels of it (optimized for client rendering based on zoom level and pan speed), and stores them in another predefined S3 bucket, with a URL based on the position and size of the tile (e.g. `/tile-x-y-size.png`), also attaching given metadata as S3 metadata headers.
4. The publisher returns a list of URLs for accessing various tile images.
5. The publisher also holds a DB of published tiles, and uses it, upon each publish / unpublish, to generate a bitmask of each chunk of the grid, indicating which locations have a published tile. Clients can use these bitmasks to efficiently request tiles from the CDN. These bitmasks are stored alongside the tiles (e.g. `/tilemap-x-y.bin`)

## Endpoints

For publishing, send a `PUT` request to `/x:y`, with a JSON body of the source image
and the metadata. For example, assuming the service is up at `https://publisher.cloud`, this
request would publish given image to (32, -12):
```http
PUT https://publisher.cloud/32:-12
Authorization: Bearer some-key
{
   "source": "submitted-image.png",
   "title": "my tile's title",
   "subtitle": "it is pretty cool aint it?",
   "link": "https://my.whatev.er"
}
```
Response:
```json
{
   "color": [235, 171, 19],
   "images": {
     "0": "https://something.cloudfront.net/tile-32--12.jpg",
     "1": "https://something.cloudfront.net/tile-32--12-1.jpg",
     "24": "https://something.cloudfront.net/tile-32--12-24.jpg",
     "48": "https://something.cloudfront.net/tile-32--12-48.jpg",
     ...
   }
}
```

For unpublishing, simply send a `DELETE` request to `/x:y`.

```http
DELETE https://publisher.cloud/32:-12
Authorization: Bearer some-key
```
Response:
```json
{
  "images": {
    "0": "https://something.cloudfront.net/tile-32--12.jpg",
    "1": "https://something.cloudfront.net/tile-32--12-1.jpg",
    "24": "https://something.cloudfront.net/tile-32--12-24.jpg",
    "48": "https://something.cloudfront.net/tile-32--12-48.jpg",
    ...
  }
}
```

### Bitmasks

The publisher holds a record of published tiles in a DB and periodically (after each publish / unpublish, throttled to batch incoming requests for each chunk) generates a bitmask for map chunks (256x256) of the map, putting them on the S3 bucket as well. For example,
following example parameters provided above, we would potentially have the following bitmasks:

```
https://something.cloudfront.net/tilemap-0-0.bin
https://something.cloudfront.net/tilemap-0-256.bin
https://something.cloudfront.net/tilemap-256-0.bin
https://something.cloudfront.net/tilemap-0--256.bin
https://something.cloudfront.net/tilemap--256-0.bin
...
```

In the bitmap, each tile is represented by a single bit, where 1 means published and 0 means unpublished. The following code provides an example of how to use a bitmask to determine whether there is a published tile at position (x, y):

```js
const CHUNK_SIZE = 256

const isPublished = async (x, y) => {
  // the x and y for the corresponding chunk
  const cx = Math.floor(x / CHUNK_SIZE) * CHUNK_SIZE
  const cy = Math.floor(y / CHUNK_SIZE) * CHUNK_SIZE

  const url = `https://something.cloudfront.net/tilemap-${cx}-${cy}.bin`
  const response = await fetch(url)
  if (response.ok) {
    const bitmap = await response.arrayBuffer()
    const bytearray = new Uint8Array(bitmap)

    // the x and y for the tile within the chunk
    const lx = x - cx
    const ly = y - cy

    // the position of the bit within the bytearray
    const bitpos = ly * CHUNK_SIZE + lx
    // the byte containing the target bit
    const byteindex = Math.floor(bitpos / 8)
    // the index of the bit within the byte
    const bitindex = bitpos % 8

    // check if the bit is flipped to 1
    return (bytes[byteindex] & (1 << bitindex)) !== 0
  } else {
    return false // the tilemap doesn't exist
  }
}
```

## Development Setup

### Prerequisites

- [Rust toolchain (latest stable version)](https://www.rust-lang.org/tools/install)
- [SQLite](https://www.sqlite.org/download.html)
- [sqlx-cli](https://crates.io/crates/sqlx-cli)
- AWS credentials with S3 access. Make sure your account key has read access to the submissions bucket and read and write for the target bucket.

### Environment Configuration

Create a `.env` file in the `publisher` root, and add the following environment variables:

```bash
# change this if you need further verbosity for debugging
RUST_LOG=info,publisher=trace

# AWS credentials
AWS_REGION=<aws-region>
AWS_ACCESS_KEY_ID=<aws-access-key>
AWS_SECRET_ACCESS_KEY=<aws-secret-key>

# S3 bucket information
S3_SOURCE_BUCKET=<bucket-for-submitted-tile-images>
S3_TARGET_BUCKET=<bucket-to-publish-tile-images-to>

# change this if you want to manage the database
# in another manner.
DATABASE_URL=sqlite://tiles.db

# OPTIONAL: CDN base URL, if you are using a CDN.
# If not provided, the bucket base URL will be used.
S3_TARGET_URL_BASE=<cdn-base-url>

# OPTIONAL: simple key authentication.
# If provided, you'd need to add "Bearer <your-auth-key>" to request headers.
AUTH_SIMPLE_KEY=<your-auth-key>

# OPTIONAL: JWT authentication.
# If provided, you'd need to add "Bearer <your-jwt-token>" to request headers.
# The token would need to be signed by the provided secret and include the given subject.
AUTH_JWT_SUBJECT=<your-jwt-subject>
AUTH_JWT_SECRET=<your-jwt-secret>
```

### Build
```bash
$ sqlx database create     # create db
$ sqlx migrate run         # run migrations
$ cargo build              # build the package
```

### Run
```bash
$ cargo run
```
or (preferrably)
```bash
$ cargo watch -x run
```
