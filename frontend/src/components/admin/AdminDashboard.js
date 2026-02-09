import React from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  People,
  Event,
  TrendingUp,
  MonetizationOn,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function StatCard({ title, value, icon, color }) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" sx={{ mt: 1 }}>
              {value}
            </Typography>
          </Box>
          <Box sx={{ p: 1, borderRadius: 1, bgcolor: `${color}.light` }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function AdminDashboard() {
  // Fetch admin stats
  const { data: statsData } = useQuery(
    'admin-stats',
    async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/dashboard/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    {
      enabled: false, // Enable when backend endpoint is ready
    }
  );

  // Fetch users
  const { data: usersData } = useQuery(
    'admin-users',
    async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    {
      enabled: false, // Enable when backend endpoint is ready
    }
  );

  // Mock data for now
  const stats = {
    totalUsers: 156,
    activeUsers: 98,
    totalEvents: 43,
    upcomingEvents: 12,
    totalBookings: 67,
    pendingBookings: 8,
    revenue: 12450,
  };

  const mockUsers = [
    { _id: '1', name: 'John Doe', email: 'john@example.com', userType: 'artist', status: 'active', createdAt: '2024-01-15' },
    { _id: '2', name: 'Jane Smith', email: 'jane@example.com', userType: 'venue', status: 'active', createdAt: '2024-01-18' },
    { _id: '3', name: 'Bob Johnson', email: 'bob@example.com', userType: 'fan', status: 'pending', createdAt: '2024-02-01' },
    { _id: '4', name: 'Alice Williams', email: 'alice@example.com', userType: 'artist', status: 'active', createdAt: '2024-02-05' },
    { _id: '5', name: 'Charlie Brown', email: 'charlie@example.com', userType: 'venue', status: 'active', createdAt: '2024-02-10' },
  ];

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'error';
  };

  const getUserTypeColor = (type) => {
    return type === 'artist' ? 'secondary' : type === 'venue' ? 'primary' : 'default';
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Admin Dashboard</Typography>
        <Typography variant="body2" color="text.secondary">
          System overview and management
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<People color="primary" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            icon={<TrendingUp color="success" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Events"
            value={stats.totalEvents}
            icon={<Event color="secondary" />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`$${stats.revenue.toLocaleString()}`}
            icon={<MonetizationOn color="warning" />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Users Table */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Recent Users</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Joined</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockUsers.map((user) => (
                <TableRow key={user._id} hover>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip label={user.userType} color={getUserTypeColor(user.userType)} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.status}
                      color={getStatusColor(user.status)}
                      size="small"
                      icon={user.status === 'active' ? <CheckCircle fontSize="small" /> : <Warning fontSize="small" />}
                    />
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* System Health */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>System Health</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>API Status</Typography>
                <Chip label="Operational" color="success" size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Database</Typography>
                <Chip label="Connected" color="success" size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>WebSocket</Typography>
                <Chip label="Active" color="success" size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Uptime</Typography>
                <Typography variant="body2">99.9%</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Pending Actions</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Pending Bookings</Typography>
                <Chip label={stats.pendingBookings} color="warning" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Reported Issues</Typography>
                <Chip label="3" color="error" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Support Tickets</Typography>
                <Chip label="12" color="info" />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default AdminDashboard;
