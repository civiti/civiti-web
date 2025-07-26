// Mock Assets Configuration for Civica Development
// This file handles placeholder images and assets for development mode

export const MOCK_IMAGE_CONFIG = {
  // Base URL for placeholder service
  placeholderService: 'https://via.placeholder.com',
  
  // Placeholder dimensions
  dimensions: {
    issueThumbnail: '400x300',
    issueMain: '800x600',
    authorityLogo: '200x200',
    heroImage: '1200x600'
  },
  
  // Color scheme for placeholders (from Colour-Scheme.md)
  colors: {
    background: 'E5E5E5', // Platinum
    text: '14213D', // Oxford Blue
    accent: 'FCA311' // Orange Web
  },
  
  // Generate placeholder image URL
  generatePlaceholderUrl: (type: 'issue' | 'authority' | 'hero', text?: string): string => {
    const config = MOCK_IMAGE_CONFIG;
    let dimensions: string;
    
    switch (type) {
      case 'issue':
        dimensions = config.dimensions.issueThumbnail;
        break;
      case 'authority':
        dimensions = config.dimensions.authorityLogo;
        break;
      case 'hero':
        dimensions = config.dimensions.heroImage;
        break;
      default:
        dimensions = '400x300';
    }
    
    const displayText = text ? encodeURIComponent(text) : 'Civica';
    return `${config.placeholderService}/${dimensions}/${config.colors.background}/${config.colors.text}?text=${displayText}`;
  },
  
  // Issue-specific image generators
  getIssueImage: (issueId: string, title: string): string => {
    const shortTitle = title.length > 20 ? title.substring(0, 20) + '...' : title;
    return MOCK_IMAGE_CONFIG.generatePlaceholderUrl('issue', `${issueId}: ${shortTitle}`);
  },
  
  // Authority logo generators
  getAuthorityLogo: (authorityName: string): string => {
    const shortName = authorityName.length > 15 ? authorityName.substring(0, 15) + '...' : authorityName;
    return MOCK_IMAGE_CONFIG.generatePlaceholderUrl('authority', shortName);
  },
  
  // Fallback images
  fallbackImages: {
    issue: 'https://via.placeholder.com/400x300/E5E5E5/14213D?text=Problema+Civica',
    authority: 'https://via.placeholder.com/200x200/E5E5E5/14213D?text=Autoritate',
    hero: 'https://via.placeholder.com/1200x600/E5E5E5/14213D?text=Platforma+Civica'
  }
};

// Development-only asset paths
export const DEV_ASSETS = {
  // Mock issue photos for development
  mockIssuePhotos: [
    MOCK_IMAGE_CONFIG.generatePlaceholderUrl('issue', 'Trotuar Deteriorat'),
    MOCK_IMAGE_CONFIG.generatePlaceholderUrl('issue', 'Iluminat Public'),
    MOCK_IMAGE_CONFIG.generatePlaceholderUrl('issue', 'Gunoi Necolectat'),
    MOCK_IMAGE_CONFIG.generatePlaceholderUrl('issue', 'Semafor Defect'),
  ],
  
  // Authority logos
  authorityLogos: {
    'primarie': MOCK_IMAGE_CONFIG.generatePlaceholderUrl('authority', 'Primăria'),
    'politie': MOCK_IMAGE_CONFIG.generatePlaceholderUrl('authority', 'Poliția'),
    'administratie': MOCK_IMAGE_CONFIG.generatePlaceholderUrl('authority', 'Administrația'),
    'other': MOCK_IMAGE_CONFIG.generatePlaceholderUrl('authority', 'Autoritate')
  }
};

// Image error handling helper
export const handleImageError = (event: Event, fallbackType: 'issue' | 'authority' | 'hero' = 'issue'): void => {
  const target = event.target as HTMLImageElement;
  if (target) {
    target.src = MOCK_IMAGE_CONFIG.fallbackImages[fallbackType];
  }
};

// Production-ready image service (for future implementation)
export const PRODUCTION_IMAGE_CONFIG = {
  // Will be configured when backend is ready
  apiBaseUrl: '', // Will come from environment
  imageEndpoints: {
    issues: '/api/issues/{id}/photos',
    authorities: '/api/authorities/{id}/logo',
    thumbnails: '/api/images/thumbnail/{id}'
  },
  
  // Image optimization parameters
  optimization: {
    quality: 80,
    format: 'webp',
    sizes: ['small', 'medium', 'large']
  }
}; 