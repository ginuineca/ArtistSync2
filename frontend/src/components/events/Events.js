import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import { Add, Search } from '@mui/icons-material';
import { useQuery } from 'react-query';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

function Events() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');

  const { data: eventsData, isLoading } = useQuery(
    ['events', searchTerm, categoryFilter, genreFilter],
    async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter) params.append('category', categoryFilter);
      if (genreFilter) params.append('genre', genreFilter);

      const response = await axios.get(`${API_URL}/api/events?${params.toString()}`);
      return response.data;
    }
  );

  const categories = ['concert', 'festival', 'club_night', 'private_event', 'workshop', 'other'];
  const genres = ['Rock', 'Pop', 'Jazz', 'Electronic', 'Hip Hop', 'Classical', 'Country', 'Blues'];

  const events = eventsData?.events || [];

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Events</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/events/new')}>
          Create Event
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Grid>
        <Grid item xs={6} md={4}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              label="Category"
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat.replace('_', ' ').toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} md={4}>
          <FormControl fullWidth>
            <InputLabel>Genre</InputLabel>
            <Select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              label="Genre"
            >
              <MenuItem value="">All Genres</MenuItem>
              {genres.map((genre) => (
                <MenuItem key={genre} value={genre}>
                  {genre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {isLoading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Loading events...</Typography>
        </Box>
      ) : events.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No events found
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {events.map((event) => (
            <Grid item xs={12} sm={6} md={4} key={event._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': { transform: 'translateY(-4px)' },
                  transition: 'transform 0.2s',
                }}
                onClick={() => navigate(`/events/${event._id}`)}
              >
                {event.media?.coverImage ? (
                  <CardMedia
                    component="img"
                    height="160"
                    image={event.media.coverImage}
                    alt={event.title}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 160,
                      bgcolor: 'primary.dark',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h3" color="text.secondary">
                      {event.title.charAt(0)}
                    </Typography>
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom noWrap>
                    {event.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {event.venue?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {new Date(event.date.start).toLocaleDateString()}
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {event.categories?.map((cat) => (
                      <Chip key={cat} label={cat} size="small" variant="outlined" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

export default Events;
