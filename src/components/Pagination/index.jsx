import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import './index.css';

const Pagination = ({ currentPage = 1, totalPages = 1, onPageChange }) => {
  if (totalPages <= 1) return null;

  // Maximum page caps (TMDB allows up to 500)
  const maxPages = Math.min(totalPages, 500);

  const getPageNumbers = () => {
    const pages = [];
    const windowSize = 2; // show current +/- 2 pages

    let start = Math.max(1, currentPage - windowSize);
    let end = Math.min(maxPages, currentPage + windowSize);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < maxPages) {
      if (end < maxPages - 1) pages.push('...');
      pages.push(maxPages);
    }

    return pages;
  };

  const handlePageClick = (page) => {
    if (page === '...' || page === currentPage || page < 1 || page > maxPages) return;
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="cineverse-pagination" aria-label="Pagination Navigation">
      {/* First Page */}
      <button
        className="pagination-nav-btn"
        onClick={() => handlePageClick(1)}
        disabled={currentPage === 1}
        title="First Page"
        aria-label="Go to first page"
      >
        <ChevronsLeft size={16} />
      </button>

      {/* Previous Page */}
      <button
        className="pagination-nav-btn prev-btn"
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Go to previous page"
      >
        <ChevronLeft size={16} />
        <span>Previous</span>
      </button>

      {/* Number Buttons */}
      <div className="pagination-numbers-list">
        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                ...
              </span>
            );
          }

          const isActive = page === currentPage;
          return (
            <button
              key={`page-${page}`}
              className={`pagination-num-btn ${isActive ? 'active' : ''}`}
              onClick={() => handlePageClick(page)}
              aria-current={isActive ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Next Page */}
      <button
        className="pagination-nav-btn next-btn"
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === maxPages}
        aria-label="Go to next page"
      >
        <span>Next</span>
        <ChevronRight size={16} />
      </button>

      {/* Last Page */}
      <button
        className="pagination-nav-btn"
        onClick={() => handlePageClick(maxPages)}
        disabled={currentPage === maxPages}
        title="Last Page"
        aria-label="Go to last page"
      >
        <ChevronsRight size={16} />
      </button>
    </nav>
  );
};

export default Pagination;
