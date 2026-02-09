import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Paper,
  Tabs,
  Tab,
  Collapse,
  Alert,
} from '@mui/material';
import {
  Search,
  Person,
  PersonAdd,
  LocationOn,
  ExpandMore,
  ExpandLess,
  FilterList,
  Clear,
} from '@mui/icons-material';
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const GENRES = [
  'Rock', 'Pop', 'Hip-Hop', 'Jazz', 'Blues', 'Country',
  'Electronic', 'Classical', 'R&B', 'Metal', 'Folk', 'Reggae',
  'Latin', 'Indie', 'Punk', 'Soul', 'Funk', 'Disco', 'House'
];

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

function SearchUsers() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [eventDateFilter, setEventDateFilter] = useState('');
  const [eventCategoryFilter, setEventCategoryFilter] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Search query
  const { data: searchData, isLoading } = useQuery(
    ['users-search', debouncedSearch, userTypeFilter, genreFilter, locationFilter, tabValue, eventDateFilter, eventCategoryFilter],
    async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (userTypeFilter) params.append('userType', userTypeFilter);
      if (genreFilter) params.append('genre', genreFilter);
      if (locationFilter) params.append('location', locationFilter);
      if (eventDateFilter) params.append('date', eventDateFilter);
      if (eventCategoryFilter) params.append('category', eventCategoryFilter);

      // Only search if we have filters
      if (!debouncedSearch && !userTypeFilter && !genreFilter && !locationFilter && !eventDateFilter && !eventCategoryFilter) {
        return tabValue === 0 ? { profiles: [] } : { events: [] };
      }

      const endpoint = tabValue === 0 ? '/api/profile/search' : '/api/events/search';
      const response = await axios.get(`${API_URL}${endpoint}?${params}`);
      return response.data;
    },
    {
      enabled: true
    }
  );

  const { data: profileData } = useQuery(
    'my-profile',
    async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/profile/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  );

  const myProfile = profileData?.profile;
  const following = myProfile?.following || [];
  const myUserId = myProfile?.user?._id;

  const followMutation = useMutation(
    async ({ profileId }) => {
      const token = localStorage.getItem('accessToken');
      return axios.post(`${API_URL}/api/profile/${profileId}/follow`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    {
      onSuccess: () => {
        window.location.reload();
      }
    }
  );

  const handleFollow = (profileId, isFollowing) => {
    if (isFollowing) {
      navigate(`/profile/${profileId}`);
    } else {
      followMutation.mutate({ profileId });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setUserTypeFilter('');
    setGenreFilter('');
    setLocationFilter('');
    setEventDateFilter('');
    setEventCategoryFilter('');
  };

  const hasActiveFilters = searchTerm || userTypeFilter || genreFilter || locationFilter || eventDateFilter || eventCategoryFilter;

  const renderUserCard = (item) => {
    if (tabValue === 0) {
      const profile = item.profile;
      const user = profile.user;
      const isFollowing = following.some(f => f._id === profile._id);

      return (
        <Grid item xs={12} sm={6} md={4} key={profile._id}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              '&:hover': { transform: 'translateY(-4px)' },
              transition: 'transform 0.2s',
            }}
            onClick={() => navigate(`/profile/${profile._id}`)}
          >
            <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
              <Avatar
                src={profile.profilePicture}
                alt={user?.name}
                sx={{
                  width: 80,
                  height: 80,
                  margin: '0 auto',
                  mb: 2,
                  bgcolor: 'primary.dark',
                }}
              >
                {user?.name?.charAt(0) || user?.username?.charAt(0)}
              </Avatar>
              <Typography variant="h6" gutterBottom noWrap>
                {user?.name || user?.username}
              </Typography>
              <Chip
                label={profile.profileType?.toUpperCase()}
                size="small"
                color={profile.profileType === 'artist' ? 'secondary' : 'primary'}
                sx={{ mb: 1 }}
              />
              {profile.profileType === 'artist' && profile.genres && profile.genres.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mb: 1 }}>
                  {profile.genres.slice(0, 3).map((genre) => (
                    <Chip key={genre} label={genre} size="small" variant="outlined" />
                  ))}
                </Box>
              )}
              {profile.profileType === 'venue' && profile.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 1 }}>
                  <LocationOn fontSize="small" />
                  <Typography variant="caption" color="text.secondary">
                    {profile.location.city}
                    {profile.location.state && `, ${profile.location.state}`}
                  </Typography>
                </Box>
              )}
              {profile.bio && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {profile.bio.substring(0, 80)}...
                </Typography>
              )}
              {profile._id !== myProfile?._id && (
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  startIcon={<PersonAdd />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFollow(profile._id, isFollowing);
                  }}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      );
    } else {
      const event = item.event;
      return (
        <Grid item xs={12} sm={6} md={4} key={event._id}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              '&:hover': { transform: 'translateY(-4px)' },
              transition: 'transform 0.2s',
            }}
            onClick={() => navigate(`/events/${event._id}`)}
          >
            {event.media?.coverImage ? (
              <CardMedia
                component="img"
                height="140"
                image={event.media.coverImage}
                alt={event.title}
              />
            ) : (
              <Box sx={{ height: 140, bgcolor: 'primary.dark', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h3">{event.title.charAt(0)}</Typography>
              </Box>
            )}
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h6" gutterBottom noWrap>
                {event.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {event.venue?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(event.date.start).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      );
    }
  };

  const results = searchData?.profiles || searchData?.events || searchData?.users || [];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Discover</Typography>
        <Typography variant="body2" color="text.secondary">
          Find artists, venues, and events
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="People" />
          <Tab label="Events" />
        </Tabs>
      </Paper>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <Search sx={{ mr: 1, color: 'text.secondary' }} />
              ),
            }}
          />
          <Button
            variant="outlined"
            startIcon={showAdvancedFilters ? <ExpandLess /> : <ExpandMore />}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            Filters
          </Button>
          {hasActiveFilters && (
            <Button
              variant="text"
              startIcon={<Clear />}
              onClick={clearFilters}
              color="error"
            >
              Clear
            </Button>
          )}
        </Box>

        {/* Advanced Filters */}
        <Collapse in={showAdvancedFilters}>
          <Grid container spacing={2}>
            {tabValue === 0 && (
              <>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>User Type</InputLabel>
                    <Select
                      value={userTypeFilter}
                      onChange={(e) => setUserTypeFilter(e.target.value)}
                      label="User Type"
                    >
                      <MenuItem value="">All Types</MenuItem>
                      <MenuItem value="artist">Artists</MenuItem>
                      <MenuItem value="venue">Venues</MenuItem>
                      <MenuItem value="fan">Fans</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Genre</InputLabel>
                    <Select
                      value={genreFilter}
                      onChange={(e) => setGenreFilter(e.target.value)}
                      label="Genre"
                    >
                      <MenuItem value="">All Genres</MenuItem>
                      {GENRES.map((genre) => (
                        <MenuItem key={genre} value={genre}>{genre}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    placeholder="City, State..."
                  />
                </Grid>
              </>
            )}
            {tabValue === 1 && (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={eventCategoryFilter}
                      onChange={(e) => setEventCategoryFilter(e.target.value)}
                      label="Category"
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      <MenuItem value="concert">Concert</MenuItem>
                      <MenuItem value="festival">Festival</MenuItem>
                      <MenuItem value="club_night">Club Night</MenuItem>
                      <MenuItem value="private_event">Private Event</MenuItem>
                      <MenuItem value="workshop">Workshop</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Date"
                    value={eventDateFilter}
                    onChange={(e) => setEventDateFilter(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Collapse>
      </Paper>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {searchTerm && <Chip label={`Search: "${searchTerm}"`} onDelete={() => setSearchTerm('')} />}
          {userTypeFilter && <Chip label={`Type: ${userTypeFilter}`} onDelete={() => setUserTypeFilter('')} />}
          {genreFilter && <Chip label={`Genre: ${genreFilter}`} onDelete={() => setGenreFilter('')} />}
          {locationFilter && <Chip label={`Location: ${locationFilter}`} onDelete={() => setLocationFilter('')} />}
          {eventCategoryFilter && <Chip label={`Category: ${eventCategoryFilter}`} onDelete={() => setEventCategoryFilter('')} />}
          {eventDateFilter && <Chip label={`Date: ${eventDateFilter}`} onDelete={() => setEventDateFilter('')} />}
        </Box>
      )}

      {isLoading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Searching...</Typography>
        </Box>
      ) : results.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          {hasActiveFilters ? (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>No results match your filters</Alert>
              <Button onClick={clearFilters} variant="outlined">Clear Filters</Button>
            </>
          ) : (
            <>
              <Person sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Start searching to discover people and events
              </Typography>
            </>
          )}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {results.map(renderUserCard)}
        </Grid>
      )}
    </Container>
  );
}

export default SearchUsers;
