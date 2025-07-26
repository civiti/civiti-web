import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SanitizationService {
  
  // Sanitize text input by removing dangerous characters
  sanitizeText(input: string): string {
    if (!input) return '';
    
    // Remove any HTML tags
    let sanitized = input.replace(/<[^>]*>/g, '');
    
    // Remove any script-like content
    sanitized = sanitized.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, ''); // Remove event handlers
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    return sanitized;
  }
  
  // Sanitize email addresses
  sanitizeEmail(email: string): string {
    if (!email) return '';
    
    // Convert to lowercase and trim
    let sanitized = email.toLowerCase().trim();
    
    // Remove any dangerous characters
    sanitized = sanitized.replace(/[<>'"]/g, '');
    
    return sanitized;
  }
  
  // Sanitize phone numbers
  sanitizePhone(phone: string): string {
    if (!phone) return '';
    
    // Keep only numbers, +, spaces, and dashes
    let sanitized = phone.replace(/[^0-9+\s-]/g, '');
    
    // Normalize format
    sanitized = sanitized.trim();
    
    return sanitized;
  }
  
  // Sanitize name fields
  sanitizeName(name: string): string {
    if (!name) return '';
    
    // Remove any HTML tags
    let sanitized = name.replace(/<[^>]*>/g, '');
    
    // Keep only letters, spaces, hyphens, and apostrophes
    sanitized = sanitized.replace(/[^a-zA-ZăâîșțĂÂÎȘȚ\s'-]/g, '');
    
    // Normalize multiple spaces
    sanitized = sanitized.replace(/\s+/g, ' ');
    
    // Trim and capitalize first letter of each word
    sanitized = sanitized.trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return sanitized;
  }
  
  // Sanitize multiline text (for comments, descriptions)
  sanitizeMultilineText(text: string, maxLength: number = 1000): string {
    if (!text) return '';
    
    // Remove HTML tags but preserve line breaks
    let sanitized = text.replace(/<(?!br\s*\/?)[^>]*>/g, '');
    
    // Remove dangerous content
    sanitized = sanitized.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
    
    // Normalize line breaks
    sanitized = sanitized.replace(/\r\n/g, '\n');
    sanitized = sanitized.replace(/\r/g, '\n');
    
    // Limit consecutive line breaks
    sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
    
    // Trim and enforce max length
    sanitized = sanitized.trim();
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength) + '...';
    }
    
    return sanitized;
  }
  
  // Sanitize URL parameters
  sanitizeUrlParam(param: string): string {
    if (!param) return '';
    
    // Remove any potentially dangerous characters
    let sanitized = param.replace(/[<>'"]/g, '');
    
    // URL encode
    sanitized = encodeURIComponent(sanitized);
    
    return sanitized;
  }
}