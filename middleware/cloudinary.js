const cloudinary=require('cloudinary').v2;
cloudinary.config(
    {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_SECRET_KEY
    }
);
const uploadcloudinary=async(localfile)=>{
    try{
        if(!localfile)return null;
        const resp=await cloudinary.uploader.upload(localfile,
            {
                resource_type:"auto",
            });
            // fs.unlinkSync(localfile);
            return  resp;
    }
    catch(err){
        fs.unlinkSync(localfile);
    }
}
module.exports = uploadcloudinary;