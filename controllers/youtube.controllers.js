import Youtube from '../models/youtube.model.js';

export const getAllYoutubeLinks = async (req, res) => {
  try {
    const links = await Youtube.find().lean().sort({ createdAt: -1 });
    res.status(200).json(links);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addYoutubeLink = async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ message: 'URL is required' });
  }

  try {
    const newLink = new Youtube({ url });
    await newLink.save();
    res.status(201).json(newLink.toObject());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteYoutubeLink = async (req, res) => {
  try {
    const deletedLink = await Youtube.findByIdAndDelete(req.params.id);

    if (!deletedLink) {
      return res.status(404).json({ message: 'Link not found' });
    }

    res.status(200).json({ message: 'Link deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
