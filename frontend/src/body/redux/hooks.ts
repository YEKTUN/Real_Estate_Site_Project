import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

/**
 * Redux Hooks
 * 
 * Bu dosya, tip güvenliği sağlayan özelleştirilmiş Redux hook'larını içerir.
 * Bu hook'ları kullanarak her seferinde tip belirtmek zorunda kalmazsınız.
 */

/**
 * Tip güvenlikli useDispatch hook'u
 * 
 * Kullanım:
 * const dispatch = useAppDispatch();
 * dispatch(someAction());
 */
export const useAppDispatch: () => AppDispatch = useDispatch;

/**
 * Tip güvenlikli useSelector hook'u
 * 
 * Kullanım:
 * const value = useAppSelector((state) => state.someSlice.someValue);
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

