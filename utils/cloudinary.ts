import { v2 as cloudinary } from "cloudinary";

try {
  cloudinary.config({
    cloud_name: process.env["CLOUDINARY_CLOUD_NAME"]!,
    api_key: process.env["CLOUDINARY_API_KEY"]!,
    api_secret: process.env["CLOUDINARY_API_SECRET"]!,
  });
} catch (err) {
  console.log("Failed to connect to cloudinary");
  console.log(err);
}

export default cloudinary;
