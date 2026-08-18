import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Star, MessageSquare, User, Reply } from 'lucide-react';
import { motion } from 'framer-motion';

interface Review {
  id: string;
  rating: number;
  comment: string;
  reply: string | null;
  createdAt: string;
  patient: {
    name: string;
  };
}

interface PatientReviewsProps {
  doctorId: string;
}

export const PatientReviews: React.FC<PatientReviewsProps> = ({ doctorId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({ averageRating: '0.0', totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [doctorId]);

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/doctors/${doctorId}/reviews`);
      setReviews(res.data.reviews);
      setStats(res.data.stats);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    setSubmitting(true);
    try {
      await api.post(`/doctors/${doctorId}/reviews`, { rating, comment });
      setComment('');
      setRating(5);
      setShowReviewForm(false);
      await fetchReviews(); // Refresh the list
    } catch (err) {
      console.error('Failed to submit review', err);
      alert('Failed to submit review. Make sure you are logged in as a patient.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (count: number, interactive = false) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={interactive ? 24 : 16}
        className={`${i < count ? 'fill-orange-400 text-orange-400' : 'fill-gray-200 text-gray-200'} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
        onClick={() => interactive && setRating(i + 1)}
      />
    ));
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded-2xl mt-8"></div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel mt-8" 
      style={{ padding: '2.5rem' }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={24} color="var(--accent)" /> Ratings & Reviews
          </h2>
          <p className="text-gray-500 mt-1">See what other patients are saying.</p>
        </div>
        <button 
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="btn btn-secondary text-sm font-bold"
        >
          {showReviewForm ? 'Cancel' : 'Write a Review'}
        </button>
      </div>

      {showReviewForm && (
        <form onSubmit={handleSubmitReview} className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 mb-8 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-gray-900 mb-4">Leave your feedback</h3>
          <div className="flex gap-2 mb-4">
            {renderStars(rating, true)}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Describe your experience with this doctor..."
            className="w-full border-gray-200 rounded-xl focus:ring-teal-500 focus:border-teal-500 text-sm p-4 min-h-[120px] mb-4"
            required
          ></textarea>
          <div className="flex justify-end">
            <button 
              type="submit"
              disabled={submitting || !comment.trim()}
              className="btn btn-primary"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-8 mb-8">
        <div className="text-center">
          <h2 className="text-5xl font-black text-gray-900">{stats.averageRating}</h2>
          <div className="flex justify-center gap-1 my-2">
            {renderStars(Math.round(parseFloat(stats.averageRating)))}
          </div>
          <p className="text-sm text-gray-500 font-medium">{stats.totalReviews} ratings</p>
        </div>
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map(star => {
            const isTop = star === 5;
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-600 w-2">{star}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${isTop ? 'bg-orange-400' : 'bg-gray-300'}`} 
                    style={{ width: isTop ? '80%' : star === 4 ? '15%' : '5%' }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No reviews yet for this doctor.</div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-700 font-bold">
                    {review.patient.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{review.patient.name}</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">{renderStars(review.rating)}</div>
                      <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-700 text-sm leading-relaxed mb-4">{review.comment}</p>

              {review.reply && (
                <div className="bg-gray-50 p-4 rounded-xl ml-8 relative border border-gray-100">
                  <div className="absolute -left-3 top-6 w-3 h-px bg-gray-300"></div>
                  <div className="absolute -left-3 top-0 w-px h-6 bg-gray-300"></div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="bg-teal-600 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">Doctor's Reply</div>
                  </div>
                  <p className="text-sm text-gray-700">{review.reply}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};
