import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Chip,
  Divider,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import { ArrowBack, Calendar, LocationOn, People } from '@mui/icons-material';
import { useQuery } from 'react-query';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: eventData, isLoading } = useQuery(
    ['event', id],
    async () => {
      const response = await axios.get(`${API_URL}/api/events/${id}`);
      return response.data;
    }
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>Loading event...</Typography>
      </Box>
    );
  }

  const event = eventData?.event;

  if (!event) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5">Event not found</Typography>
          <Button onClick={() => navigate('/events')} sx={{ mt: 2 }}>
            Back to Events
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/events')}
        sx={{ mb: 3 }}
      >
        Back to Events
      </Button>

      <Paper sx={{ p: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Typography variant="h3" gutterBottom>
              {event.title}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {event.categories?.map((cat) => (
                <Chip key={cat} label={cat.replace('_', ' ').toUpperCase()} />
              ))}
              {event.genres?.map((genre) => (
                <Chip key={genre} label={genre} variant="outlined" size="small" />
              ))}
            </Box>

            {event.media?.coverImage && (
              <Box
                component="img"
                src={event.media.coverImage}
                alt={event.title}
                sx={{
                  width: '100%',
                  maxHeight: 400,
                  objectFit: 'cover',
                  borderRadius: 2,
                  mb: 3,
                }}
              />
            )}

            <Typography variant="h6" gutterBottom>
              About this event
            </Typography>
            <Typography variant="body1" paragraph>
              {event.description}
            </Typography>

            {event.artists && event.artists.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Lineup
                </Typography>
                <List>
                  {event.artists.map((artistInfo) => (
                    <ListItem key={artistInfo.artist._id}>
                      <ListItemAvatar>
                        <Avatar src={artistInfo.artist.profilePicture}>
                          {artistInfo.artist.name?.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={artistInfo.artist.name}
                        secondary={
                          <Chip
                            label={artistInfo.status.toUpperCase()}
                            size="small"
                            color={
                              artistInfo.status === 'confirmed'
                                ? 'success'
                                : artistInfo.status === 'declined'
                                ? 'error'
                                : 'default'
                            }
                          />
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Calendar sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Date & Time
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {new Date(event.date.start).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(event.date.start).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Venue
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {event.venue?.name}
                  </Typography>
                  {event.location?.address?.city && (
                    <Typography variant="body2" color="text.secondary">
                      {event.location.address.city}
                      {event.location.address.state &&
                        `, ${event.location.address.state}`}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Capacity
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {event.capacity} attendees
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Age Restriction
              </Typography>
              <Chip label={event.ageRestriction?.replace('_', ' ').toUpperCase()} size="small" />

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Status
              </Typography>
              <Chip
                label={event.status.toUpperCase()}
                color={
                  event.status === 'published'
                    ? 'success'
                    : event.status === 'cancelled'
                    ? 'error'
                    : 'default'
                }
                size="small"
              />

              {event.ticketing?.enabled && event.ticketing.tiers?.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Tickets
                  </Typography>
                  {event.ticketing.tiers.map((tier, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                        p: 1,
                        bgcolor: 'background.default',
                        borderRadius: 1,
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {tier.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {tier.quantity - tier.quantitySold} available
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="bold">
                        ${tier.price}
                      </Typography>
                    </Box>
                  ))}
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2 }}
                    disabled={event.isSoldOut}
                  >
                    {event.isSoldOut ? 'Sold Out' : 'Get Tickets'}
                  </Button>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default EventDetail;
