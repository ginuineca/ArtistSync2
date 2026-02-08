import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Rating,
  Button,
  Card,
  CardContent,
  TextField,
  Grid,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Star, ArrowBack } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Reviews() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profileId } = useParams();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch reviews for a profile
  const { data: reviewsData, isLoading } = useQuery(
    ['reviews', profileId],
    async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/reviews/profile/${profileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    { enabled: !!profileId }
  );

  // Fetch my reviews
  const { data: myReviewsData } = useQuery(
    'my-reviews',
    async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/reviews/user/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  );

  const submitReviewMutation = useMutation(
    async (reviewData) => {
      const token = localStorage.getItem('accessToken');
      return axios.post(`${API_URL}/api/reviews`, reviewData, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    {
      onSuccess: () => {
        setSuccess(true);
        setTimeout(() => {
          navigate(-1);
        }, 1500);
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rating) {
      return;
    }

    submitReviewMutation.mutate({
      profile: profileId,
      rating,
      comment
    });
  };

  const helpfulMutation = useMutation(
    async (reviewId) => {
      const token = localStorage.getItem('accessToken');
      return axios.post(`${API_URL}/api/reviews/${reviewId}/helpful`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['reviews', profileId]);
        queryClient.invalidateQueries('my-reviews');
      }
    }
  );

  const reviews = profileId ? reviewsData?.reviews || [] : myReviewsData?.reviews || [];

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        {profileId ? (
          <>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate(`/profile/${profileId}`)}
              sx={{ mb: 2 }}
            >
              Back to Profile
            </Button>
            <Typography variant="h4">Reviews</Typography>
          </>
        ) : (
          <Typography variant="h4">My Reviews</Typography>
        )}
      </Box>

      {profileId && !success && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Leave a Review</Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography component="legend">Rating:</Typography>
                  <Rating
                    value={rating}
                    onChange={(e, newValue) => setRating(newValue)}
                    precision={0.5}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Your Review"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitReviewMutation.isLoading}
                  startIcon={submitReviewMutation.isLoading ? <CircularProgress size={20} /> : <Star />}
                >
                  Submit Review
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 4 }}>
          Review submitted successfully!
        </Alert>
      )}

      {submitReviewMutation.isError && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {submitReviewMutation.error.response?.data?.message || 'Error submitting review'}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : reviews.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Star sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No reviews yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Be the first to leave a review
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {reviews.map((review) => (
            <Grid item xs={12} key={review._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Avatar src={review.reviewer?.profilePicture}>
                        {review.reviewer?.name?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1">
                          {review.reviewer?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Rating value={review.rating} readOnly precision={0.5} />
                      <Typography variant="caption" color="text.secondary">
                        {review.helpfulCount} {review.helpfulCount === 1 ? 'person found this helpful' : 'people found this helpful'}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body1" paragraph>
                    {review.comment}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => helpfulMutation.mutate(review._id)}
                    disabled={helpfulMutation.isLoading}
                  >
                    Helpful ({review.helpfulCount})
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

export default Reviews;
