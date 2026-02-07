import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  AppBar,
  Toolbar,
  Chip,
} from '@mui/material';
import { ArrowBack, Send, Circle } from '@mui/icons-material';
import { useQuery, useQueryClient } from 'react-query';
import axios from 'axios';
import { useSocket } from '../../contexts/SocketContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Conversation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const socket = useSocket();
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);

  const { data: conversationData, isLoading } = useQuery(
    ['conversation', id],
    async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/messages/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    }
  );

  useEffect(() => {
    // Join conversation room via Socket.IO
    if (socket.connected && id) {
      socket.joinConversation(id);
    }

    // Listen for new messages via Socket.IO
    const handleMessageNew = ({ message: newMessage }) => {
      setMessages(prev => {
        // Avoid duplicates
        if (prev.find(m => m._id === newMessage._id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
    };

    const handleUserTyping = ({ userId }) => {
      setTypingUsers(prev => [...new Set([...prev, userId])]);
    };

    const handleUserStopTyping = ({ userId }) => {
      setTypingUsers(prev => prev.filter(id => id !== userId));
    };

    if (socket.socket) {
      socket.socket.on('message:new', handleMessageNew);
      socket.socket.on('user:typing', handleUserTyping);
      socket.socket.on('user:stop_typing', handleUserStopTyping);
    }

    return () => {
      if (socket.socket) {
        socket.socket.off('message:new', handleMessageNew);
        socket.socket.off('user:typing', handleUserTyping);
        socket.socket.off('user:stop_typing', handleUserStopTyping);
      }
      if (id) {
        socket.leaveConversation(id);
      }
    };
  }, [id, socket]);

  useEffect(() => {
    // Load initial messages
    const loadMessages = async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/messages/conversations/${id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data.messages || []);

      // Mark as read via Socket.IO
      if (socket.connected) {
        socket.markMessagesAsRead(id);
      }
    };

    if (id) {
      loadMessages();
    }
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (messageText.trim() && socket.connected) {
      // Send via Socket.IO for real-time delivery
      socket.sendMessage(id, messageText.trim());
      setMessageText('');
      socket.stopTyping(id);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }

    // Send typing indicator
    if (messageText.trim() && socket.connected) {
      socket.startTyping(id);
    }
  };

  const handleChange = (e) => {
    setMessageText(e.target.value);

    // Send typing indicator
    if (e.target.value.trim() && socket.connected) {
      socket.startTyping(id);
    } else if (socket.connected) {
      socket.stopTyping(id);
    }
  };

  const getConversationName = (conv) => {
    if (!conv) return 'Chat';
    if (conv.type === 'direct') {
      const userId = localStorage.getItem('userId');
      const otherParticipant = conv.participants.find((p) => p.user._id !== userId);
      return otherParticipant?.user?.name || otherParticipant?.user?.username || 'Unknown';
    }
    return conv.groupInfo?.name || 'Group Chat';
  };

  const conversation = conversationData?.conversation;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>Loading conversation...</Typography>
      </Box>
    );
  }

  const isOtherUserTyping = typingUsers.length > 0 &&
    typingUsers.some(id => id !== localStorage.getItem('userId'));

  return (
    <Container maxWidth="md" sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate('/messages')}>
            <ArrowBack />
          </IconButton>
          <Avatar sx={{ ml: 1, mr: 2 }} src={conversation?.groupInfo?.avatar}>
            {getConversationName(conversation).charAt(0)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div">
              {getConversationName(conversation)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {socket.isUserOnline(conversation?.participants?.find(p => p.user._id !== localStorage.getItem('userId'))?.user?._id) && (
                <Circle sx={{ fontSize: 8, color: 'success.main' }} />
              )}
              {isOtherUserTyping && (
                <Typography variant="caption" color="primary">
                  typing...
                </Typography>
              )}
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Paper
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          mt: 2,
        }}
      >
        <List sx={{ flexGrow: 1, p: 2 }}>
          {messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">No messages yet. Start the conversation!</Typography>
            </Box>
          ) : (
            messages.map((message, index) => {
              const isOwn = message.sender._id === localStorage.getItem('userId');
              return (
                <ListItem
                  key={message._id || index}
                  sx={{
                    flexDirection: 'column',
                    alignItems: isOwn ? 'flex-end' : 'flex-start',
                    p: 1,
                  }}
                >
                  {!isOwn && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Avatar
                        src={message.sender.profilePicture}
                        sx={{ width: 24, height: 24, mr: 1 }}
                      >
                        {message.sender.name?.charAt(0) || message.sender.username?.charAt(0)}
                      </Avatar>
                      <Typography variant="caption" color="text.secondary">
                        {message.sender.name || message.sender.username}
                      </Typography>
                    </Box>
                  )}
                  <Paper
                    sx={{
                      px: 2,
                      py: 1,
                      bgcolor: isOwn ? 'primary.main' : 'background.paper',
                      color: isOwn ? 'primary.contrastText' : 'text.primary',
                      maxWidth: '70%',
                      borderRadius: 2,
                      borderBottomRightRadius: isOwn ? 0 : 2,
                      borderBottomLeftRadius: isOwn ? 2 : 0,
                    }}
                  >
                    <Typography variant="body1">{message.content}</Typography>
                  </Paper>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, px: 1 }}>
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {message.metadata?.edited && ' (edited)'}
                  </Typography>
                </ListItem>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </List>

        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Type a message..."
              value={messageText}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              disabled={!socket.connected}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={!messageText.trim() || !socket.connected}
              sx={{ alignSelf: 'flex-end' }}
            >
              <Send />
            </IconButton>
          </Box>
          {!socket.connected && (
            <Typography variant="caption" color="warning">
              Reconnecting...
            </Typography>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default Conversation;
