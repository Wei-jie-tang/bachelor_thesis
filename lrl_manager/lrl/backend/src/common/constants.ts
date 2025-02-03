import path from "path";

// Directory paths

export const D_TMP = path.join(__dirname, "..", "..", "tmp");
export const D_ASSET = path.join(__dirname, "..", "..", "asset");

// HTTP Status codes

export const STATUS_NO_CONTENT = 204;
export const STATUS_INTERNAL_SERVER_ERROR = 500;
export const STATUS_OK = 200;
