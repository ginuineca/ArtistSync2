import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { Add, Delete, ArrowBack } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Portfolio() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    mediaUrl: '',
    category: 'image',
    tags: ''
  });

  const { data: portfolioData, isLoading } = useQuery(
    'my-portfolio',
    async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/profile/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  );

  const uploadMutation = useMutation(
    async (itemData) => {
      const token = localStorage.getItem('accessToken');
      return axios.post(`${API_URL}/api/profile/me/portfolio`, itemData, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('my-portfolio');
        setUploadDialogOpen(false);
        setNewItem({ title: '', description: '', mediaUrl: '', category: 'image', tags: '' });
      }
    }
  );

  const deleteMutation = useMutation(
    async (itemId) => {
      const token = localStorage.getItem('accessToken');
      return axios.delete(`${API_URL}/api/profile/me/portfolio/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('my-portfolio');
      }
    }
  );

  const portfolio = portfolioData?.profile?.portfolio || [];

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Portfolio</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Add Item
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : portfolio.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No portfolio items yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Showcase your work by adding portfolio items
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Add Your First Item
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {portfolio.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item._id}>
              <Card>
                {item.media?.url ? (
                  <CardMedia
                    component="img"
                    height="200"
                    image={item.media.url}
                    alt={item.title}
                  />
                ) : (
                  <Box sx={{ height: 200, bgcolor: 'grey.300', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography>No Image</Typography>
                  </Box>
                )}
                <CardContent>
                  <Typography variant="h6">{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
                    {item.description}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {item.tags?.map((tag) => (
                      <Chip key={tag} label={tag} size="small" />
                    ))}
                  </Box>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => deleteMutation.mutate(item._id)}
                  >
                    <Delete />
                  </IconButton>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Portfolio Item</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Media URL"
              value={newItem.mediaUrl}
              onChange={(e) => setNewItem({ ...newItem, mediaUrl: e.target.value })}
              helperText="Enter URL of your image/audio/video file"
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                label="Category"
              >
                <MenuItem value="image">Image</MenuItem>
                <MenuItem value="audio">Audio</MenuItem>
                <MenuItem value="video">Video</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => uploadMutation.mutate(newItem)}
            disabled={uploadMutation.isLoading || !newItem.title}
            variant="contained"
          >
            {uploadMutation.isLoading ? <CircularProgress size={20} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Portfolio;
