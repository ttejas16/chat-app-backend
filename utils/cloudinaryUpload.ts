import { unlinkSync } from 'fs';
import { UploadApiOptions } from 'cloudinary';
import cloudinary from './cloudinary';
import { Express } from 'express';

// options for cloudinary
const cloudinaryOptions: UploadApiOptions = {
  use_filename: true,
  unique_filename: true,
  overwrite: true,
  resource_type: 'auto',
  folder: "avatars"
};

/* 
    expects a file and returns url of the uploaded file if file if uploaded successfully
    if file upload fails null is returned
    finally block used for cleanup 
*/
async function uploadImage(file: Express.Multer.File) {

  try {
    // const result = await cloudinary.uploader.upload(file.path, cloudinaryOptions);
    return file.path;
    // return result.url;

  } catch (err) {
    console.log(err);
    return null;
  }
  finally {
    // unlinkSync(file.path);
  }

}

export { uploadImage };

