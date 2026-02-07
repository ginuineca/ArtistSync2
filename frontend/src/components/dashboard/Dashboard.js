import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Event as EventIcon,
  Message as MessageIcon,
  Star as StarIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

function Dashboard() {
  const navigate = useNavigate();

  const { data: statsData, isLoading: statsLoading } = useQuery(
    'dashboard-stats',
    async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    }
  );

  const { data: overviewData } = useQuery(
    'dashboard-overview',
    async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/dashboard/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    }
  );

  const stats = statsData?.stats || {};

  const StatCard = ({ title, value, icon, color, onClick }) => (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { transform: 'translateY(-4px)' } : {},
        transition: 'transform 0.2s',
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: `${color}.main`,
              color: `${color}.contrastText`,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <Typography variant="h3" component="div" fontWeight="bold">
          {value || 0}
        </Typography>
      </CardContent>
    </Card>
  );

  if (statsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {stats.user?.name || stats.user?.username}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your account
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Events"
            value={stats.events?.total || stats.events?.upcoming || 0}
            icon={<EventIcon />}
            color="primary"
            onClick={() => navigate('/events')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Messages"
            value={stats.messages?.unreadCount || 0}
            icon={<MessageIcon />}
            color="secondary"
            onClick={() => navigate('/messages')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Reviews"
            value={stats.reviews?.total || 0}
            icon={<StarIcon />}
            color="warning"
            onClick={() => navigate('/profile')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Followers"
            value={stats.profile?.followers || 0}
            icon={<PeopleIcon />}
            color="info"
            onClick={() => navigate('/profile')}
          />
        </Grid>

        {overviewData?.overview?.upcomingEvents?.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Upcoming Events
              </Typography>
              {overviewData.overview.upcomingEvents.map((event) => (
                <Card
                  key={event._id}
                  sx={{ mb: 2, cursor: 'pointer' }}
                  onClick={() => navigate(`/events/${event._id}`)}
                >
                  <CardContent>
                    <Typography variant="h6">{event.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(event.date.start).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Paper>
          </Grid>
        )}

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Account Information
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Account Type
              </Typography>
              <Chip
                label={stats.user?.userType?.toUpperCase()}
                color="primary"
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Member Since
              </Typography>
              <Typography variant="body1">
                {stats.user?.memberSince
                  ? new Date(stats.user.memberSince).toLocaleDateString()
                  : 'N/A'}
              </Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={stats.user?.isVerified ? 'Verified' : 'Unverified'}
                color={stats.user?.isVerified ? 'success' : 'default'}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;
