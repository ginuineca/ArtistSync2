import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Avatar,
  Button,
  TextField,
  Grid,
  Chip,
  Divider,
} from '@mui/material';
import { Edit, Save } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

function Profile() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    profilePicture: '',
    genres: '',
    location: '',
  });

  const { data: profileData, isLoading } = useQuery(
    'my-profile',
    async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        if (data.profile) {
          setFormData({
            name: data.profile.name || '',
            description: data.profile.description || '',
            profilePicture: data.profile.profilePicture || '',
            genres: data.profile.artistDetails?.genres?.join(', ') || '',
            location: data.profile.location?.address?.city || '',
          });
        }
      },
    }
  );

  const updateMutation = useMutation(
    async (data) => {
      const token = localStorage.getItem('accessToken');
      return await axios.put(`${API_URL}/api/profile/me`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('my-profile');
        setEditing(false);
      },
    }
  );

  const handleSave = () => {
    const data = {
      name: formData.name,
      description: formData.description,
      profilePicture: formData.profilePicture,
    };
    if (formData.genres) {
      data.genres = formData.genres.split(',').map((g) => g.trim());
    }
    if (formData.location) {
      data.location = {
        address: { city: formData.location },
      };
    }
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const profile = profileData?.profile;

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
          <Typography variant="h4">My Profile</Typography>
          {!editing ? (
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={updateMutation.isLoading}
            >
              Save Changes
            </Button>
          )}
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar
                src={profile?.profilePicture}
                sx={{ width: 150, height: 150, mx: 'auto', mb: 2 }}
              >
                {profile?.name?.charAt(0) || '?'}
              </Avatar>
              <Typography variant="h5">{profile?.name}</Typography>
              <Chip
                label={profile?.profileType?.toUpperCase()}
                color="primary"
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box>
              <Typography variant="h6" gutterBottom>
                Stats
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Profile Views</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {profile?.stats?.profileViews || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Followers</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {profile?.stats?.followers || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Rating</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {profile?.stats?.rating || 0}/5
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Reviews</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {profile?.stats?.reviewCount || 0}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={8}>
            {editing ? (
              <Box>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  margin="normal"
                  multiline
                  rows={4}
                />
                <TextField
                  fullWidth
                  label="Profile Picture URL"
                  value={formData.profilePicture}
                  onChange={(e) => setFormData({ ...formData, profilePicture: e.target.value })}
                  margin="normal"
                />
                {profile?.profileType === 'artist' && (
                  <TextField
                    fullWidth
                    label="Genres (comma separated)"
                    value={formData.genres}
                    onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                    margin="normal"
                    helperText="e.g., Rock, Jazz, Blues"
                  />
                )}
                <TextField
                  fullWidth
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  margin="normal"
                />
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  About
                </Typography>
                <Typography variant="body1" paragraph>
                  {profile?.description || 'No description added yet.'}
                </Typography>

                {profile?.location?.address?.city && (
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

                {profile?.artistDetails?.genres && profile.artistDetails.genres.length > 0 && (
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

                {profile?.socialLinks && (
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
                    </Box>
                  </>
                )}
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default Profile;
