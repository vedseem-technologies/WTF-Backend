import Testimonial from "../models/testimonials.model.js";

import { paginate } from '../utils/pagination.js';

const getTestimonials = async (req, res) => {
  try {
    const { cursor, limit, direction, search } = req.query;
    const query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    const result = await paginate(Testimonial, query, { cursor, limit, direction });
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({ message: "Failed to fetch testimonials" });
  }
};

const addTestimonial = async (req, res) => {
  try {
    const { name, role, text, rating, date, image } = req.body;

    if (!name || !role || !text) {
      return res.status(400).json({ message: "Name, role, and text are required" });
    }

    const newTestimonial = await Testimonial.create({
      name,
      role,
      text,
      rating,
      date,
      image,
    });

    res.status(201).json(newTestimonial);
  } catch (error) {
    console.error("Error adding testimonial:", error);
    res.status(500).json({ message: "Failed to add testimonial" });
  }
};

const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, text, rating, date, image } = req.body;

    const updatedTestimonial = await Testimonial.findByIdAndUpdate(
      id,
      { name, role, text, rating, date, image },
      { new: true, lean: true }
    );

    if (!updatedTestimonial) {
      return res.status(404).json({ message: "Testimonial not found" });
    }

    res.status(200).json(updatedTestimonial);
  } catch (error) {
    console.error("Error updating testimonial:", error);
    res.status(500).json({ message: "Failed to update testimonial" });
  }
};

const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTestimonial = await Testimonial.findByIdAndDelete(id);

    if (!deletedTestimonial) {
      return res.status(404).json({ message: "Testimonial not found" });
    }

    res.status(200).json({ message: "Testimonial deleted successfully" });
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    res.status(500).json({ message: "Failed to delete testimonial" });
  }
};

export {
  getTestimonials,
  addTestimonial,
  updateTestimonial,
  deleteTestimonial,
};
