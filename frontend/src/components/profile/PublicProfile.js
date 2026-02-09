import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Avatar,
  Button,
  Grid,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import { PersonAdd, ArrowBack } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

function PublicProfile() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  // Record profile view
  useEffect(() => {
    const recordView = async () => {
      const token = localStorage.getItem('accessToken');
      try {
        await axios.post(`${API_URL}/api/profile/${id}/view`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        // Silently fail - view tracking is optional
        console.log('View tracking failed:', error.message);
      }
    };
    recordView();
  }, [id]);

  // Fetch profile data
  const { data: profileData, isLoading } = useQuery(
    ['public-profile', id],
    async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/profile/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    }
  );

  // Follow mutation
  const followMutation = useMutation(
    async () => {
      const token = localStorage.getItem('accessToken');
      return await axios.post(`${API_URL}/api/profile/${id}/follow`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['public-profile', id]);
        queryClient.invalidateQueries('my-profile');
      },
    }
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const profile = profileData?.profile;
  const isFollowing = profileData?.isFollowing || false;

  if (!profile) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6">Profile not found</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Button
        startIcon={<ArrowBack />}
        sx={{ mb: 2 }}
        onClick={() => window.history.back()}
      >
        Back
      </Button>

      <Paper sx={{ p: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar
                src={profile.profilePicture}
                sx={{ width: 150, height: 150, mx: 'auto', mb: 2 }}
              >
                {profile.name?.charAt(0) || '?'}
              </Avatar>
              <Typography variant="h5">{profile.name}</Typography>
              <Chip
                label={profile.profileType?.toUpperCase()}
                color="primary"
                size="small"
                sx={{ mt: 1 }}
              />
              <Button
                variant="outlined"
                fullWidth
                startIcon={<PersonAdd />}
                sx={{ mt: 2 }}
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isLoading}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box>
              <Typography variant="h6" gutterBottom>
                Stats
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Profile Views</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {profile.stats?.profileViews || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Followers</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {profile.stats?.followers || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Rating</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {profile.stats?.rating || 0}/5
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Reviews</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {profile.stats?.reviewCount || 0}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              About
            </Typography>
            <Typography variant="body1" paragraph>
              {profile.description || 'No description added yet.'}
            </Typography>

            {profile.location?.address?.city && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Location
                </Typography>
                <Typography variant="body1">
                  {profile.location.address.city}
                  {profile.location.address.country &&
                    `, ${profile.location.address.country}`}
                </Typography>
              </>
            )}

            {profile.artistDetails?.genres && profile.artistDetails.genres.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Genres
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.artistDetails.genres.map((genre) => (
                    <Chip key={genre} label={genre} variant="outlined" />
                  ))}
                </Box>
              </>
            )}

            {profile.artistDetails?.portfolio && profile.artistDetails.portfolio.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Portfolio
                </Typography>
                <Grid container spacing={2}>
                  {profile.artistDetails.portfolio.map((item, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Box
                        component="img"
                        src={item.thumbnailUrl || item.url}
                        alt={item.title}
                        sx={{
                          width: '100%',
                          height: 150,
                          objectFit: 'cover',
                          borderRadius: 1,
                        }}
                      />
                      <Typography variant="caption">{item.title}</Typography>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            {profile.socialLinks && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Social Links
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {profile.socialLinks.website && (
                    <Typography variant="body2">
                      Website: {profile.socialLinks.website}
                    </Typography>
                  )}
                  {profile.socialLinks.spotify && (
                    <Typography variant="body2">
                      Spotify: {profile.socialLinks.spotify}
                    </Typography>
                  )}
                  {profile.socialLinks.soundcloud && (
                    <Typography variant="body2">
                      SoundCloud: {profile.socialLinks.soundcloud}
                    </Typography>
                  )}
                </Box>
              </>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default PublicProfile;
