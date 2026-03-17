import React, { useState, useRef } from 'react';
import './RSVPForm.css';

function RSVPForm({ selectedSeat, eventId, onSubmitSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current.click();
  };

  const removePhoto = (e) => {
    e.stopPropagation();
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Valid email is required');
      return false;
    }
    if (!formData.phone.trim() || !/^\d{7,}$/.test(formData.phone.replace(/\D/g, ''))) {
      setError('Valid phone number is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          seatNumber: selectedSeat,
          hasPaymentProof: !!photo,
          eventId: eventId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit RSVP');
        setLoading(false);
        return;
      }

      // If there's a photo, upload it
      if (photo) {
        const formDataPhoto = new FormData();
        formDataPhoto.append('photo', photo);
        formDataPhoto.append('email', formData.email);
        
        await fetch('/api/upload-proof', {
          method: 'POST',
          body: formDataPhoto
        });
      }

      setSuccess(true);
      setFormData({ name: '', email: '', phone: '' });
      setPhoto(null);
      setPhotoPreview(null);
      
      setTimeout(() => {
        onSubmitSuccess();
      }, 2000);
    } catch (error) {
      setError('An error occurred. Please try again.');
      console.error('Error:', error);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="form-success">
        <div className="success-icon">✓</div>
        <h3>You're in! 🎉</h3>
        <p>Your spot has been reserved.<br />Check your email for confirmation.</p>
        <p className="success-details">
          A confirmation has been sent to <strong>{formData.email}</strong>
        </p>
      </div>
    );
  }

  return (
    <form className="rsvp-form" onSubmit={handleSubmit}>
      <h3>Reserve your spot</h3>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label htmlFor="name">Full Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Jane Doe"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="jane@example.com"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone">Phone Number</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+1 (555) 000-0000"
          disabled={loading}
        />
      </div>

      {selectedSeat && (
        <div className="form-group selected-seat">
          <p>
            Seat {selectedSeat}
          </p>
        </div>
      )}

      <div className="photo-upload">
        <label className="photo-upload-label">Payment Proof</label>
        <div 
          className={`photo-upload-area ${photoPreview ? 'has-image' : ''}`}
          onClick={handlePhotoClick}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          {photoPreview ? (
            <div className="photo-upload-wrapper">
              <img src={photoPreview} alt="Payment proof" className="photo-preview" />
              <button type="button" className="photo-remove" onClick={removePhoto}>×</button>
            </div>
          ) : (
            <>
              <div className="photo-upload-icon">📷</div>
              <div className="photo-upload-text">
                Click to upload <span>payment proof</span>
              </div>
            </>
          )}
        </div>
      </div>

      <button 
        type="submit" 
        className="btn-submit"
        disabled={loading}
      >
        {loading ? 'Reserving...' : 'Reserve spot'}
      </button>

      <p className="form-note">
        Rp15,000 per person • Payment required to confirm
      </p>
    </form>
  );
}

export default RSVPForm;

