import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { CalendarToday, AccessTime, AttachMoney } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

function Bookings() {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  // Get sent bookings
  const { data: sentData, isLoading: sentLoading } = useQuery(
    'sent-bookings',
    async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    }
  );

  // Get received bookings
  const { data: receivedData, isLoading: receivedLoading } = useQuery(
    'received-bookings',
    async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/bookings/received`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    }
  );

  // Update status mutation
  const statusMutation = useMutation(
    async ({ bookingId, status }) => {
      const token = localStorage.getItem('accessToken');
      return axios.put(
        `${API_URL}/api/bookings/${bookingId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sent-bookings');
        queryClient.invalidateQueries('received-bookings');
      },
    }
  );

  // Send message mutation
  const messageMutation = useMutation(
    async ({ bookingId, message }) => {
      const token = localStorage.getItem('accessToken');
      return axios.post(
        `${API_URL}/api/bookings/${bookingId}/messages`,
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sent-bookings');
        queryClient.invalidateQueries('received-bookings');
        setNewMessage('');
        setMessageDialogOpen(false);
      },
    }
  );

  const handleStatusChange = (bookingId, status) => {
    statusMutation.mutate({ bookingId, status });
  };

  const handleSendMessage = () => {
    if (selectedBooking && newMessage.trim()) {
      messageMutation.mutate({ bookingId: selectedBooking._id, message: newMessage });
    }
  };

  const sentBookings = sentData?.bookings || [];
  const receivedBookings = receivedData?.bookings || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'declined': return 'error';
      case 'cancelled': return 'default';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const renderBookingCard = (booking, isReceived = false) => (
    <Card key={booking._id} sx={{ mb: 2 }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6">{booking.event?.title}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <CalendarToday fontSize="small" color="text.secondary" />
              <Typography variant="body2">
                {new Date(booking.performance?.date).toLocaleDateString()}
              </Typography>
              <AccessTime fontSize="small" color="text.secondary" />
              <Typography variant="body2">
                {booking.performance?.startTime} - {booking.performance?.endTime}
              </Typography>
            </Box>
            {booking.performance?.paymentAmount && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <AttachMoney fontSize="small" color="text.secondary" />
                <Typography variant="body2">
                  {booking.performance.paymentAmount.amount} {booking.performance.paymentAmount.currency}
                </Typography>
              </Box>
            )}
            <Box sx={{ mt: 1 }}>
              <Chip label={status} color={getStatusColor(status)} size="small" />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            {isReceived && booking.status === 'pending' && (
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={() => handleStatusChange(booking._id, 'accepted')}
                >
                  Accept
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => handleStatusChange(booking._id, 'declined')}
                >
                  Decline
                </Button>
              </Box>
            )}
            {!isReceived && booking.status === 'pending' && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => handleStatusChange(booking._id, 'cancelled')}
              >
                Cancel
              </Button>
            )}
            <Button
              variant="text"
              size="small"
              onClick={() => {
                setSelectedBooking(booking);
                setMessageDialogOpen(true);
              }}
            >
              Message
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Bookings</Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your event bookings and requests
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`Sent (${sentBookings.length})`} />
          <Tab label={`Received (${receivedBookings.length})`} />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        {sentLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : sentBookings.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No sent bookings
            </Typography>
          </Paper>
        ) : (
          sentBookings.map((booking) => renderBookingCard(booking, false))
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {receivedLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : receivedBookings.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No received bookings
            </Typography>
          </Paper>
        ) : (
          receivedBookings.map((booking) => renderBookingCard(booking, true))
        )}
      </TabPanel>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onClose={() => setMessageDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Message</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            sx={{ mt: 2 }}
          />
          {selectedBooking?.messages?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Previous Messages:</Typography>
              {selectedBooking.messages.map((msg, i) => (
                <Box key={i} sx={{ mb: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {msg.sender?.name} - {new Date(msg.timestamp).toLocaleString()}
                  </Typography>
                  <Typography variant="body2">{msg.message}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessageDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSendMessage}
            variant="contained"
            disabled={messageMutation.isLoading || !newMessage.trim()}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Bookings;
