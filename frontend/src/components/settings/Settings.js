import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  FormControlLabel,
  Switch,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
  ListItemIcon,
} from '@mui/material';
import { Person, ArrowBack, Save } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState('');

  const { data: profileData } = useQuery(
    'my-profile-settings',
    async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/profile/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  );

  const [formData, setFormData] = React.useState({
    name: '',
    bio: '',
    location: {
      city: '',
      state: '',
      country: ''
    },
    genres: [],
    socialLinks: {
      website: '',
      facebook: '',
      twitter: '',
      instagram: '',
      spotify: '',
      soundcloud: '',
      youtube: ''
    },
    notificationSettings: {
      email: true,
      push: true,
      marketing: false
    }
  });

  React.useEffect(() => {
    if (profileData?.profile) {
      const profile = profileData.profile;
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        location: profile.location || { city: '', state: '', country: '' },
        genres: profile.genres || [],
        socialLinks: profile.socialLinks || {}
      });
    }
  }, [profileData]);

  const updateProfileMutation = useMutation(
    async (data) => {
      const token = localStorage.getItem('accessToken');
      return axios.put(`${API_URL}/api/profile/me`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    {
      onSuccess: () => {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
        queryClient.invalidateQueries('my-profile-settings');
      },
      onError: (err) => {
        setError(err.response?.data?.message || 'Error updating profile');
      }
    }
  );

  const handleChange = (field) => (e) => {
    const value = field.includes('.')
      ? { ...formData, [field.split('.')[0]]: { ...formData[field.split('.')[0]], [field.split('.')[1]]: e.target.value } }
      : { ...formData, [field]: e.target.value };
    setFormData(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    updateProfileMutation.mutate(formData);
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {
        refreshToken: localStorage.getItem('refreshToken')
      });
      localStorage.clear();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/profile')}
          sx={{ mb: 2 }}
        >
          Back to Profile
        </Button>
        <Typography variant="h4">Settings</Typography>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb:3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Account Settings */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Account Information</Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Display Name"
              value={formData.name}
              onChange={handleChange('name')}
            />
          </Grid>

          {/* Location */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Location</Typography>
          </Grid>

          <Grid item xs={4}>
            <TextField
              fullWidth
              label="City"
              value={formData.location.city}
              onChange={(e) => setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })}
            />
          </Grid>

          <Grid item xs={4}>
            <TextField
              fullWidth
              label="State"
              value={formData.location.state}
              onChange={(e) => setFormData({ ...formData, location: { ...formData.location, state: e.target.value } })}
            />
          </Grid>

          <Grid item xs={4}>
            <TextField
              fullWidth
              label="Country"
              value={formData.location.country}
              onChange={(e) => setFormData({ ...formData, location: { ...formData.location, country: e.target.value } })}
            />
          </Grid>

          {/* Bio */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Bio"
              value={formData.bio}
              onChange={handleChange('bio')}
              helperText="Tell others about yourself"
            />
          </Grid>

          {/* Social Links */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Social Links</Typography>
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Website"
              value={formData.socialLinks.website || ''}
              onChange={handleChange('socialLinks.website')}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Spotify"
              value={formData.socialLinks.spotify || ''}
              onChange={handleChange('socialLinks.spotify')}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="SoundCloud"
              value={formData.socialLinks.soundcloud || ''}
              onChange={handleChange('socialLinks.soundcloud')}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="YouTube"
              value={formData.socialLinks.youtube || ''}
              onChange={handleChange('socialLinks.youtube')}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {/* Notifications */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Notifications</Typography>
          </Grid>

          <Grid item xs={12}>
            <List>
              <ListItem>
                <ListItemIcon>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.notificationSettings.email}
                        onChange={(e) => setFormData({
                          ...formData,
                          notificationSettings: { ...formData.notificationSettings, email: e.target.checked }
                        })}
                      />
                    }
                    label="Email notifications"
                  />
                </ListItemIcon>
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.notificationSettings.push}
                        onChange={(e) => setFormData({
                          ...formData,
                          notificationSettings: { ...formData.notificationSettings, push: e.target.checked }
                        })}
                      />
                    }
                    label="Push notifications"
                  />
                </ListItemIcon>
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.notificationSettings.marketing}
                        onChange={(e) => setFormData({
                          ...formData,
                          notificationSettings: { ...formData.notificationSettings, marketing: e.target.checked }
                        })}
                      />
                    }
                    label="Marketing emails"
                  />
                </ListItemIcon>
              </ListItem>
            </List>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {/* Danger Zone */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="error">Danger Zone</Typography>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleLogout}
              sx={{ mb: 2 }}
            >
              Logout
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={updateProfileMutation.isLoading}
              startIcon={updateProfileMutation.isLoading ? <Save /> : <Save />}
            >
              Save Changes
            </Button>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
}

export default Settings;
