import express, { text } from "express";
import cors from "cors";
import joi from 'joi'
import dotenv from "dotenv";
import { MongoClient } from 'mongodb';
import dayjs from "dayjs"

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI)
let db;
mongoClient.connect(() => {
    db = mongoClient.db();
  });

  const participantsSchema=joi.object({
    name:joi.string().required()
  })
  const messagesSchema=joi.object({
    to:joi.string().required(),
    text:joi.string().required(),
    type:joi.valid('message','private_message')
  })


  app.post('/participants', async (req, res) => {
    const {name} = req.body;
    const {error} = participantsSchema.validate(req.body);
        if (error){
            res.sendStatus(422);
            return;
        }
        const participantExistent = await db.collection("participants").findOne({ name: name });
        if (participantExistent){
            res.sendStatus(409);
            return;
        }
    try {

      await db.collection('participants').insertOne({
        name:name,
        lastStatus:Date.now()
      })
      await db.collection('messages').insertOne({
        from:name,
        to:"Todos",
        text:"entra na sala...",
        type:"status",
        time:`${dayjs().hour()}:${dayjs().minute()}:${dayjs().second()}`
      })
      res.sendStatus(201);
    } catch (error) {
      console.error(error);
      res.sendStatus(500);
    }
  });

app.get('/participants', async (req, res) => {
    try {
        const participants = await db.collection('participants').find().toArray();
    res.send(participants);
    } catch (error) {
        console.error(error);
    res.sendStatus(500);
    }
})
app.post('/messages',async (req,res)=>{
    const user = req.headers.user;
    const {error}=messagesSchema.validate(req.body);
    if(error){
        res.sendStatus(422);
        return;
    }
    const participantExistent = await db.collection("participants").findOne({ name: user });
        if (!participantExistent){
            res.sendStatus(422);
            return;
        }

    let message={
        ...req.body,
        from:user,
        time:`${dayjs().hour()}:${dayjs().minute()}:${dayjs().second()}`
    }

    try {
        await db.collection('messages').insertOne(message)
    
        res.send(message);
        
    } catch (error) {
        console.error(error);
      res.sendStatus(500);
    }


})



  app.listen(5000, () => {
    console.log('Server is listening on port 5000.');
  });