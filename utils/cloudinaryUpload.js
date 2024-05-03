const path = require('path');
const { unlinkSync } = require('fs');
const cloudinary = require('./cloudinary');

async function uploadImage(file) {

  try {
    const options = {
      use_filename: true,
      unique_filename: true,
      overwrite: true,
      resource_type: 'auto',
      folder: "avatars"
    };

    const result = await cloudinary.uploader.upload(file.path, options);

    return result.url;

  } catch (err) {
    console.log(err);
    return null;
  }
  finally {
    unlinkSync(file.path);
  }

}

module.exports = { uploadImage };

