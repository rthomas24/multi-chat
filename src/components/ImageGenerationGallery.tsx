"use client";

import styles from './ImageGenerationGallery.module.css';
import ImageGenerationCard from './ImageGenerationCard';

interface ImageModel {
  id: string;
  modelName: string;
  imageUrl: string;
  providerIcon?: string;
}

interface ImageGenerationGalleryProps {
  imagePrompt: string;
  setImagePrompt: (prompt: string) => void;
}

export default function ImageGenerationGallery({ imagePrompt, setImagePrompt }: ImageGenerationGalleryProps) {
  // These would eventually be dynamic based on API responses
  const imageCards: ImageModel[] = [
    {
      id: 'gpt-4o',
      modelName: 'GPT-4o',
      imageUrl: '/images/landscape-tree.jpg',
      providerIcon: '/provider-icons/openai-icon.svg',
    },
    {
      id: 'grok-3',
      modelName: 'Grok 3',
      imageUrl: '/images/landscape-tree.jpg',
      providerIcon: '/provider-icons/xai-icon.svg',
    },
    {
      id: 'gemini',
      modelName: 'Gemini',
      imageUrl: '/images/landscape-tree.jpg',
      providerIcon: '/provider-icons/google-icon.svg',
    },
    {
      id: 'claude-35',
      modelName: 'Claude 3.5',
      imageUrl: '/images/landscape-tree.jpg',
      providerIcon: '/provider-icons/anthropic-icon.svg',
    },
  ];

  const handleGenerateImages = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Generating images for prompt:', imagePrompt);
    // Image generation logic would go here
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>One prompt, multiple visual interpretations</h1>
      <p className={styles.subheading}>Compare how different AI models visualize your ideas</p>
      
      <div className={styles.galleryGrid}>
        {imageCards.map(card => (
          <ImageGenerationCard
            key={card.id}
            modelName={card.modelName}
            imageUrl={card.imageUrl}
            providerIcon={card.providerIcon}
            onDownload={() => console.log(`Download image from ${card.modelName}`)}
            onCopy={() => console.log(`Copy image from ${card.modelName}`)}
            onRegenerate={() => console.log(`Regenerate image from ${card.modelName}`)}
          />
        ))}
      </div>
      
      <div className={styles.promptContainer}>
        <form onSubmit={handleGenerateImages} className={styles.promptForm}>
          <input
            type="text"
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className={styles.promptInput}
          />
        </form>
      </div>
    </div>
  );
} 