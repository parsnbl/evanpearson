import 'dotenv/config';
import {connect, Schema, model, Types } from 'mongoose';


dbConnect()
  .then(()=> console.log('mongodb connection established.'))
  .catch(err => console.log(err))

async function dbConnect():Promise<void> {
  const un = process.env.DB_UN;
  const pw = process.env.DB_PW;
  const opts = process.env.DB_OPTS;
  await connect(
    `mongodb://${un}:${pw}@localhost:27017/parsnbl?${opts}`
    );
}

//id, date, categtory, tags, slug, title, rawContent, html
interface Blog {
  _id: Types.ObjectId,
  createdAt: Date,
  slug: string,
  title: string,
  category?: string,
  tags?: Types.Array<string>,
  rawContent: string,
  html?: string,
}

const blogSchema = new Schema({
  createdAt: {type: Date, required: true},
  slug: {type: String, required: true},
  title: {type: String, required: true},
  category: String,
  tags: [String],
  rawContent: {type: String, required: true},
  html: String,
});

export const Blog = model('blog', blogSchema);




