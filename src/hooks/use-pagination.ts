import { useState, useEffect, useCallback } from "react";

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UsePaginationOptions {
  initialPage?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
}

export interface UsePaginationReturn extends PaginationState {
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  setTotalItems: (total: number) => void;
  setItemsPerPage: (itemsPerPage: number) => void;
  reset: () => void;
}

export function usePagination({
  initialPage = 1,
  itemsPerPage = 50,
  onPageChange,
}: UsePaginationOptions = {}): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalItems, setTotalItems] = useState(0);
  const [perPage, setPerPage] = useState(itemsPerPage);

  const totalPages = Math.ceil(totalItems / perPage);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages));
      if (validPage !== currentPage) {
        setCurrentPage(validPage);
        onPageChange?.(validPage);
      }
    },
    [currentPage, totalPages, onPageChange],
  );

  const goToNextPage = useCallback(() => {
    if (hasNextPage) {
      goToPage(currentPage + 1);
    }
  }, [hasNextPage, currentPage, goToPage]);

  const goToPreviousPage = useCallback(() => {
    if (hasPreviousPage) {
      goToPage(currentPage - 1);
    }
  }, [hasPreviousPage, currentPage, goToPage]);

  const goToFirstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const goToLastPage = useCallback(() => {
    goToPage(totalPages);
  }, [goToPage, totalPages]);

  const setTotalItemsCallback = useCallback(
    (total: number) => {
      setTotalItems(total);
      // Si la página actual es mayor que el total de páginas, ir a la última página
      const newTotalPages = Math.ceil(total / perPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    },
    [perPage, currentPage],
  );

  const setItemsPerPageCallback = useCallback(
    (newItemsPerPage: number) => {
      setPerPage(newItemsPerPage);
      // Recalcular la página actual basada en el nuevo itemsPerPage
      const newTotalPages = Math.ceil(totalItems / newItemsPerPage);
      const newCurrentPage = Math.min(currentPage, newTotalPages);
      setCurrentPage(newCurrentPage);
    },
    [totalItems, currentPage],
  );

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setTotalItems(0);
    setPerPage(itemsPerPage);
  }, [initialPage, itemsPerPage]);

  // Reset current page when total items changes significantly
  useEffect(() => {
    if (totalItems === 0 && currentPage > 1) {
      setCurrentPage(1);
    }
  }, [totalItems, currentPage]);

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage: perPage,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    setTotalItems: setTotalItemsCallback,
    setItemsPerPage: setItemsPerPageCallback,
    reset,
  };
}
