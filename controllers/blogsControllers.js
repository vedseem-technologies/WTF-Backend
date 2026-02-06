import Blogs from "../models/blogs.model.js"

import { paginate } from '../utils/pagination.js';

const getBlogs = async (req, res) => {
  try {
    const { cursor, limit, direction, blogType, search } = req.query;
    const query = {};
    if (blogType) query.blogType = blogType;
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const result = await paginate(Blogs, query, { cursor, limit, direction });
    res.status(200).json(result);
  }
  catch (error) {
    console.log(error);
    res.status(500).json({ message: "Blogs did not get" })
  }
}
const addBlogs = async (req, res) => {
  const { title, date, image, description, blogType } = req.body;

  if (!title || !date || !image || !description || !blogType) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newBlog = await Blogs.create({ title, date, image, description, blogType });
    res.status(201).json(newBlog.toObject());
  } catch (error) {
    console.log(error, "Blogs didnt post");
    res.status(500).json({ message: error.message });
  }


}

const editBlogs = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, image, description, blogType } = req.body;
    const updatedBlog = await Blogs.findByIdAndUpdate(id, { title, date, image, description, blogType }, { new: true, lean: true });
    res.status(200).json(updatedBlog);
  }
  catch (error) {
    console.log(error);
    res.status(500).json({ message: "Blogs did not get" })
  }
}

const deleteBlogs = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBlog = await Blogs.findByIdAndDelete(id);
    res.status(200).json(deletedBlog);
  }
  catch (error) {
    console.log(error);
    res.status(500).json({ message: "Blogs did not get" })
  }
}

export { addBlogs, getBlogs, editBlogs, deleteBlogs };