import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Grid,
  CircularProgress,
} from '@mui/material';
import { CalendarToday, LocationOn, Favorite } from '@mui/icons-material';
import { useQuery } from 'react-query';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Favorites() {
  const navigate = useNavigate();

  const { data: favoritesData, isLoading } = useQuery(
    'favorite-events',
    async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/events/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    }
  );

  const events = favoritesData?.events || [];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Favorite color="error" />
          My Favorites
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Events you've saved for later
        </Typography>
      </Box>

      {events.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Favorite sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No favorite events yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Start exploring and save events you're interested in
          </Typography>
        </Card>
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
                    height="140"
                    image={event.media.coverImage}
                    alt={event.title}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 140,
                      bgcolor: 'primary.dark',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h3">{event.title.charAt(0)}</Typography>
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom noWrap>
                    {event.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <CalendarToday fontSize="small" color="text.secondary" />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(event.date.start).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <LocationOn fontSize="small" color="text.secondary" />
                    <Typography variant="caption" color="text.secondary">
                      {event.venue?.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {event.categories?.slice(0, 2).map((cat) => (
                      <Chip key={cat} label={cat.replace('_', ' ')} size="small" variant="outlined" />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                    <Favorite fontSize="small" color="error" />
                    <Typography variant="caption" color="text.secondary">
                      {event.meta?.likes || 0}
                    </Typography>
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

export default Favorites;
