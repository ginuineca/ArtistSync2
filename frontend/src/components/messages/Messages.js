import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Badge,
  TextField,
  Paper,
  Divider,
  IconButton,
  Chip,
  Circle,
} from '@mui/material';
import { Search, Notifications } from '@mui/icons-material';
import { useQuery } from 'react-query';
import axios from 'axios';
import { useSocket } from '../../contexts/SocketContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Messages() {
  const navigate = useNavigate();
  const socket = useSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const { data: conversationsData, isLoading, refetch } = useQuery(
    'conversations',
    async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    }
  );

  // Listen for new messages and update unread count
  useEffect(() => {
    if (!socket.socket) return;

    const handleMessageNew = ({ message }) => {
      refetch();
    };

    const handleUnreadCount = ({ unreadCount: count }) => {
      setUnreadCount(count);
    };

    socket.socket.on('message:new', handleMessageNew);
    socket.socket.on('notification:unread_count', handleUnreadCount);

    return () => {
      socket.socket?.off('message:new', handleMessageNew);
      socket.socket?.off('notification:unread_count', handleUnreadCount);
    };
  }, [socket.socket, refetch]);

  const conversations = conversationsData?.conversations || [];

  const getConversationName = (conv) => {
    if (conv.type === 'direct') {
      const otherParticipant = conv.participants.find((p) => {
        const userId = localStorage.getItem('userId');
        return p.user._id !== userId;
      });
      return otherParticipant?.user?.name || otherParticipant?.user?.username || 'Unknown';
    }
    return conv.groupInfo?.name || 'Group Chat';
  };

  const getConversationAvatar = (conv) => {
    if (conv.type === 'direct') {
      const otherParticipant = conv.participants.find((p) => {
        const userId = localStorage.getItem('userId');
        return p.user._id !== userId;
      });
      return otherParticipant?.user?.profilePicture;
    }
    return conv.groupInfo?.avatar;
  };

  const getLastMessage = (conv) => {
    if (!conv.lastMessage) return 'No messages yet';
    const content = conv.lastMessage.content;
    return content.length > 50 ? content.substring(0, 50) + '...' : content;
  };

  const formatTime = (date) => {
    if (!date) return '';
    const messageDate = new Date(date);
    const now = new Date();
    const diff = now - messageDate;

    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
    return messageDate.toLocaleDateString();
  };

  const isUserOnline = (conv) => {
    if (conv.type === 'direct') {
      const otherParticipant = conv.participants.find((p) => {
        const userId = localStorage.getItem('userId');
        return p.user._id !== userId;
      });
      return socket.isUserOnline(otherParticipant?.user?._id);
    }
    return false;
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchTerm) return true;
    const name = getConversationName(conv).toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  return (
    <Container maxWidth="md">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Messages</Typography>
        <Chip
          icon={<Notifications />}
          label={`${socket.notifications.filter(n => n.type === 'message').length} new`}
          color="primary"
          size="small"
          onClick={() => socket.clearNotifications()}
          sx={{ cursor: 'pointer' }}
        />
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Box>
        <Divider />
        <List sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
          {isLoading ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography>Loading conversations...</Typography>
            </Box>
          ) : filteredConversations.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {searchTerm ? 'No conversations found' : 'No conversations yet'}
              </Typography>
            </Box>
          ) : (
            filteredConversations.map((conv) => (
              <ListItem
                key={conv._id}
                button
                onClick={() => navigate(`/messages/${conv._id}`)}
                alignItems="flex-start"
                sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
              >
                <ListItemAvatar>
                  <Badge badgeContent={conv.unreadCount || 0} color="primary">
                    <Avatar src={getConversationAvatar(conv)}>
                      {getConversationName(conv).charAt(0)}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: conv.unreadCount > 0 ? 'bold' : 'normal' }}
                      >
                        {getConversationName(conv)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isUserOnline(conv) && (
                          <Circle sx={{ fontSize: 10, color: 'success.main' }} />
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {conv.updatedAt && formatTime(conv.updatedAt)}
                        </Typography>
                      </Box>
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: conv.unreadCount > 0 ? 'medium' : 'normal',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      {!socket.connected && '(Offline) '}
                      {getLastMessage(conv)}
                    </Typography>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </Paper>

      {!socket.connected && (
        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.main' }}>
          <Typography variant="body2">
            Connection lost. Reconnecting...
          </Typography>
        </Paper>
      )}
    </Container>
  );
}

export default Messages;
