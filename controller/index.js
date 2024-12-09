require("dotenv").config();
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const knex = require("knex");
const configOptions = require("../knexfile");
const db = knex(configOptions);


function encodeImage(image) {

  const imageFilePath = path.resolve(__dirname, `../public/images/${image}`);


  const imageFile = fs.readFileSync(imageFilePath);


  const base64ImageStr = Buffer.from(imageFile).toString("base64");

  return base64ImageStr;
}

const allImageController = async (req, res) => {
    const select_images = []
    if (req.query.search_text){
        search_text = req.query.search_text.toLowerCase()
        const images = await db("image").select("name","detected_label")
        const imagesLabel = await db("image").select("detected_label")
        for(i=0;i<imagesLabel.length;i++){
            if(imagesLabel[i].detected_label.toLowerCase().indexOf(search_text)!==-1){
                select_images.push(images[i])
            }
        }

        if(select_images.length!==0)
            {
                res.send({select_images,message:`please input this website and the given name to see(png/jpg) or download(jfif) the image e.g. http://localhost:3000/images/${select_images[0].name}`})
            }
        else{
            res.status(500).send({message:"No such images"})
        }

    }else{
         const images = await db("image").select("name","detected_label");
         res.send({images,message:`please input this website and the given name to see(png/jpg) or download(jfif) the image e.g. http://localhost:3000/images/${images[0].name}`})
    }
};


const createImageController = async (req, res) => {
  try {

    const apiKey = process.env.API_KEY;
    const imageFileName = req.file.originalname;
    const base64ImageStr = encodeImage(imageFileName);


    const request_body = {
        requests: [
          {
            image: {
              content: base64ImageStr,
            },
            features: [
              {
                type: "DOCUMENT_TEXT_DETECTION",
              },
            ],
          },
        ],
      };
  
      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        request_body
      );
      const result = response.data;
      const text_annotations = result.responses[0].textAnnotations;
  
      if (!text_annotations) {
        console.log(result.responses);
        throw new Error("text_annotations does not exist");
      }
  
      const texts = [];
      for (const text of text_annotations) {
        texts.push(text.description);
      }
  
      const labels = texts; 
      const newImage = await db("image")
        .insert({
          name: imageFileName,
          detected_label: labels.join(","),
        });
  
      if (newImage.rowCount === 1) {
        return res.status(201).json({ message: "Image created successfully" });
      } else {
        throw new Error("Failed to create image record");
      }
    } catch (error) {
      console.error("Error details:", error);
      res.status(500).json({ error: error.message });
    }
  };

module.exports = {
  allImageController,
  createImageController,
};