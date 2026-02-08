import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  DatePicker,
  Switch,
  FormControlLabel,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { useState as useStateHook } from 'react';
import { useMutation } from 'react-query';
import axios from 'axios';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const categories = ['concert', 'festival', 'club_night', 'private_event', 'workshop', 'other'];
const genres = ['Rock', 'Pop', 'Jazz', 'Electronic', 'Hip Hop', 'Classical', 'Country', 'Blues', 'R&B', 'Metal', 'Indie'];
const ageRestrictions = ['all_ages', '18_plus', '21_plus'];

function CreateEvent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: null,
    endDate: null,
    capacity: '',
    categories: ['concert'],
    genres: [],
    ageRestriction: 'all_ages',
    ticketPrice: '',
    ticketUrl: '',
    coverImageUrl: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (field) => (date) => {
    setFormData(prev => ({ ...prev, [field]: date }));
  };

  const handleCategoryToggle = (category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleGenreToggle = (genre) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const createEventMutation = useMutation(
    async (eventData) => {
      const token = localStorage.getItem('accessToken');
      return axios.post(`${API_URL}/api/events`, eventData, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    {
      onSuccess: (response) => {
        setSuccess(true);
        setTimeout(() => {
          navigate(`/events/${response.data.event._id}`);
        }, 1500);
      },
      onError: (err) => {
        setError(err.response?.data?.message || 'Error creating event');
        setLoading(false);
      }
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.title || !formData.description || !formData.startDate || !formData.endDate || !formData.capacity) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    const eventData = {
      title: formData.title,
      description: formData.description,
      date: {
        start: formData.startDate.toISOString(),
        end: formData.endDate.toISOString()
      },
      capacity: parseInt(formData.capacity),
      categories: formData.categories,
      genres: formData.genres,
      ageRestriction: formData.ageRestriction,
      ticketing: {
        enabled: !!formData.ticketPrice || !!formData.ticketUrl,
        tiers: formData.ticketPrice ? [{
          name: 'General Admission',
          price: parseFloat(formData.ticketPrice),
          currency: 'USD'
        }] : [],
        externalUrl: formData.ticketUrl
      },
      media: formData.coverImageUrl ? {
        coverImage: formData.coverImageUrl
      } : {}
    };

    createEventMutation.mutate(eventData);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md">
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/events')}
            sx={{ mb: 2 }}
          >
            Back to Events
          </Button>
          <Typography variant="h4">Create New Event</Typography>
        </Box>

        {success ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="success.main">
              Event created successfully! Redirecting...
            </Typography>
          </Paper>
        ) : (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Basic Info */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Event Title *"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description *"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  required
                />
              </Grid>

              {/* Date & Time */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Date & Time</Typography>
              </Grid>

              <Grid item xs={6}>
                <DatePicker
                  label="Start Date & Time *"
                  value={formData.startDate}
                  onChange={handleDateChange('startDate')}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              <Grid item xs={6}>
                <DatePicker
                  label="End Date & Time *"
                  value={formData.endDate}
                  onChange={handleDateChange('endDate')}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              {/* Event Details */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Event Details</Typography>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Capacity *"
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Age Restriction</InputLabel>
                  <Select
                    name="ageRestriction"
                    value={formData.ageRestriction}
                    onChange={handleChange}
                    label="Age Restriction"
                  >
                    {ageRestrictions.map((restriction) => (
                      <MenuItem key={restriction} value={restriction}>
                        {restriction.replace('_', ' ').toUpperCase()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Categories */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>Categories</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {categories.map((category) => (
                    <Chip
                      key={category}
                      label={category.replace('_', ' ').toUpperCase()}
                      onClick={() => handleCategoryToggle(category)}
                      color={formData.categories.includes(category) ? 'primary' : 'default'}
                      clickable
                    />
                  ))}
                </Box>
              </Grid>

              {/* Genres */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>Genres</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {genres.map((genre) => (
                    <Chip
                      key={genre}
                      label={genre}
                      onClick={() => handleGenreToggle(genre)}
                      color={formData.genres.includes(genre) ? 'secondary' : 'default'}
                      clickable
                    />
                  ))}
                </Box>
              </Grid>

              {/* Ticketing */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Ticketing</Typography>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Ticket Price (USD)"
                  name="ticketPrice"
                  type="number"
                  value={formData.ticketPrice}
                  onChange={handleChange}
                  helperText="Leave empty for free events"
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="External Ticket URL"
                  name="ticketUrl"
                  value={formData.ticketUrl}
                  onChange={handleChange}
                  helperText="Link to external ticketing site"
                />
              </Grid>

              {/* Media */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Cover Image</Typography>
                <TextField
                  fullWidth
                  label="Cover Image URL"
                  name="coverImageUrl"
                  value={formData.coverImageUrl}
                  onChange={handleChange}
                  helperText="Enter image URL (use Upload page to upload images)"
                />
              </Grid>

              {/* Error Message */}
              {error && (
                <Grid item xs={12}>
                  <Typography color="error">{error}</Typography>
                </Grid>
              )}

              {/* Submit */}
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading || createEventMutation.isLoading}
                  startIcon={loading || createEventMutation.isLoading ? <CircularProgress size={20} /> : <Save />}
                >
                  Create Event
                </Button>
              </Grid>
            </Grid>
          </form>
        )}
      </Container>
    </LocalizationProvider>
  );
}

export default CreateEvent;
