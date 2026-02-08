import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Paper,
  Badge,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import { Delete, DoneAll, Notifications, Event as EventIcon, Message, Person, ThumbUp } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { notifications, clearNotifications } = useSocket();
  const [tabValue, setTabValue] = React.useState(0);

  const { data: notificationsData, isLoading } = useQuery(
    'notifications',
    async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    {
      refetchInterval: 30000, // Poll every 30 seconds
    }
  );

  const { data: unreadCountData } = useQuery(
    'unread-count',
    async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  );

  const markAsReadMutation = useMutation(
    async (notificationId) => {
      const token = localStorage.getItem('accessToken');
      return axios.put(`${API_URL}/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications');
        queryClient.invalidateQueries('unread-count');
      }
    }
  );

  const markAllAsReadMutation = useMutation(
    async () => {
      const token = localStorage.getItem('accessToken');
      return axios.put(`${API_URL}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications');
        queryClient.invalidateQueries('unread-count');
      }
    }
  );

  const deleteNotificationMutation = useMutation(
    async (notificationId) => {
      const token = localStorage.getItem('accessToken');
      return axios.delete(`${API_URL}/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications');
        queryClient.invalidateQueries('unread-count');
      }
    }
  );

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification._id);
    }
    // Navigate based on notification type
    switch (notification.type) {
      case 'message':
        navigate(`/messages/${notification.data.conversation}`);
        break;
      case 'event_invitation':
        navigate(`/events/${notification.data.event}`);
        break;
      case 'booking_update':
        navigate(`/events/${notification.data.event}`);
        break;
      case 'follow':
        navigate(`/profile/${notification.data.follower?._id}`);
        break;
      case 'review':
        navigate(`/profile/${notification.data.reviewee?._id}`);
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <Message color="primary" />;
      case 'event_invitation':
        return <EventIcon color="secondary" />;
      case 'booking_update':
        return <EventIcon color="info" />;
      case 'follow':
        return <Person color="success" />;
      case 'review':
        return <ThumbUp color="warning" />;
      default:
        return <Person />;
    }
  };

  const getNotificationText = (notification) => {
    const { data, type } = notification;
    switch (type) {
      case 'message':
        return `New message from ${data.sender?.name || data.sender?.username || 'Someone'}`;
      case 'event_invitation':
        return `You're invited to ${data.eventTitle || 'an event'}`;
      case 'booking_update':
        return data.status === 'confirmed'
          ? `Your booking for ${data.eventTitle} has been confirmed!`
          : data.status === 'cancelled'
          ? `Your booking for ${data.eventTitle} was cancelled`
          : `Booking update for ${data.eventTitle}`;
      case 'follow':
        return `${data.follower?.name || data.follower?.username} started following you`;
      case 'review':
        return `${data.reviewer?.name || data.reviewer?.username} reviewed you`;
      default:
        return notification.title || 'New notification';
    }
  };

  const allNotifications = notificationsData?.notifications || [];
  const unreadCount = unreadCountData?.unreadCount || 0;

  // Filter by read status
  const unreadNotifications = allNotifications.filter(n => !n.read);
  const readNotifications = allNotifications.filter(n => n.read);

  return (
    <Container maxWidth="md">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4">Notifications</Typography>
          {unreadCount > 0 && (
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          )}
        </Box>
        {allNotifications.length > 0 && (
          <Button
            startIcon={<DoneAll />}
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isLoading}
          >
            Mark All Read
          </Button>
        )}
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab
            label={`Unread (${unreadNotifications.length})`}
            disabled={unreadNotifications.length === 0}
          />
          <Tab
            label={`All (${allNotifications.length})`}
          disabled={allNotifications.length === 0}
          />
        </Tabs>
      </Paper>

      {isLoading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Loading notifications...</Typography>
        </Box>
      ) : allNotifications.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No notifications yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            When you get notifications, they'll appear here
          </Typography>
        </Card>
      ) : (
        <>
          <TabPanel value={tabValue} index={0}>
            <List>
              {unreadNotifications.map((notification, index) => (
                <React.Fragment key={notification._id}>
                  <ListItem
                    alignItems="flex-start"
                    button
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      bgcolor: notification.read ? 'transparent' : 'action.hover',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: notification.read ? 'grey.300' : 'primary.main' }}>
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={getNotificationText(notification)}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </Typography>
                          <Chip
                            label={notification.type.replace('_', ' ').toUpperCase()}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                    />
                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotificationMutation.mutate(notification._id);
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </ListItem>
                  {index < unreadNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <List>
              {allNotifications.map((notification, index) => (
                <React.Fragment key={notification._id}>
                  <ListItem
                    alignItems="flex-start"
                    button
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      opacity: notification.read ? 0.7 : 1,
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: notification.read ? 'grey.300' : 'primary.main' }}>
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={getNotificationText(notification)}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </Typography>
                          {!notification.read && (
                            <Chip label="New" size="small" color="primary" />
                          )}
                          <Chip
                            label={notification.type.replace('_', ' ').toUpperCase()}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                    />
                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotificationMutation.mutate(notification._id);
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </ListItem>
                  {index < allNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </TabPanel>
        </>
      )}
    </Container>
  );
}

export default Notifications;
