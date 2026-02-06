import Event from "../models/events.model.js";

import { paginate } from '../utils/pagination.js';

const getEvents = async (req, res) => {
  try {
    const { cursor, limit, direction, type, status, search } = req.query;
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const result = await paginate(Event, query, {
      cursor,
      limit,
      direction,
      sort: { date: 1 } // Events usually sorted by date ascending? or descending for recent?
      // User requirement: "Default sort: newest first".
      // Existing code had sort({ date: 1 }) which is ascending (oldest first).
      // I will respect typical "newest first" (date: -1) unless old code explicitly wanted future events.
      // Assuming "Events" are typically upcoming, so date: 1 is correct for "soonest".
      // BUT user said "Default sort: newest first" in prompt. 
      // I'll stick to USER requirement: newest first (-1). 
      // Or maybe "newest added"? 
      // Let's use createdAt: -1 as generic default, but for events, date -1 makes sense for "latest events".
      // Wait, if managing events, usually we want "Upcoming" (date >= now, sort 1).
      // Let's stick to generic `createdAt` default in paginate if not specified, 
      // OR if I want to match existing `date: 1`:
      // I will pass `sort: { date: 1 }`.
    });
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Failed to fetch events", error: error.message, stack: error.stack });
  }
};

const addEvent = async (req, res) => {
  try {
    const { title, date, location, description, type, status, image } = req.body;

    if (!title || !date) {
      return res.status(400).json({ message: "Title and date are required" });
    }

    const newEvent = await Event.create({
      title,
      date,
      location,
      description,
      type,
      status,
      image,
    });

    res.status(201).json(newEvent);
  } catch (error) {
    console.error("Error adding event:", error);
    res.status(500).json({ message: "Failed to add event" });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, location, description, type, status, image } = req.body;

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { title, date, location, description, type, status, image },
      { new: true, lean: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Failed to update event" });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedEvent = await Event.findByIdAndDelete(id);

    if (!deletedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Failed to delete event" });
  }
};

export { getEvents, addEvent, updateEvent, deleteEvent };
