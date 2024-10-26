import { Client, buildClient } from '@datocms/cma-client-browser';
import { RenderFieldExtensionCtx } from 'datocms-plugin-sdk';
import { Button, Canvas, Spinner } from 'datocms-react-ui';
import { isArray } from 'lodash';
import get from 'lodash/get';
import { useState } from 'react';

type PropTypes = {
  ctx: RenderFieldExtensionCtx;
};
async function fetchAlt(
  apiKey: string,
  client: Client,
  asset: Record<string, string>
) {
  const { url } = await client.uploads.find(asset.upload_id);

  try {
    const response = await fetch('https://alttextgeneratorai.com/api/dato', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        image: { url },
      }),
    });

    // Check if the response status is OK (200-299 range)
    if (!response.ok) {
      console.error(`Server returned error: ${response.status} - ${response.statusText}`);
      // Log the response text for debugging
      const errorText = await response.text();
      console.error("Response text:", errorText);
      throw new Error("API request failed");
    }

    // Attempt to parse the response as JSON
    const data = await response.json();
    return data;

  } catch (error) {
    console.error("Error in fetchAlt function:", error);
    // Return an object with a default error message for alt text
    return { alt_text: "Error generating alt text" };
  }
}


async function generateAlts(
  currentFieldValue: unknown,
  ctx: RenderFieldExtensionCtx,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) {
  setIsLoading(true);
  try {
    const client = buildClient({  apiToken: '749c5604a57eada561c5a436cc37ab' || '' });
    const isGallery = isArray(currentFieldValue);
    if (isGallery) {
      const newAssets = [];
      for (const asset of currentFieldValue) {
        const result = await fetchAlt(
          ctx.plugin.attributes.parameters.apiKey as string,
          client,
          asset
        );

        asset.alt = result.alt_text;
        newAssets.push(asset);
      }
      ctx.setFieldValue(ctx.fieldPath, newAssets);
    } else {
      const assetValue = currentFieldValue as Record<string, string>;

      const result = await fetchAlt(
        ctx.plugin.attributes.parameters.apiKey as string,
        client,
        assetValue
      );

      assetValue.alt = result.alt_text;
      ctx.setFieldValue(ctx.fieldPath, assetValue);
    }
  } catch (error) {
    console.log(error);
  }

  setIsLoading(false);
}

const AltTextAIButton = ({ ctx }: PropTypes) => {
  const [isLoading, setIsLoading] = useState(false);
  const currentFieldValue = get(ctx.formValues, ctx.fieldPath);
  const isGallery = isArray(currentFieldValue);
  const isGalleryWithItems =
    isArray(currentFieldValue) && currentFieldValue.length;

  return (
    <Canvas ctx={ctx}>
      {(isGalleryWithItems || (!isGallery && !!currentFieldValue)) && (
        <Button
          fullWidth
          disabled={isLoading}
          onClick={() => {
            generateAlts(currentFieldValue, ctx, setIsLoading);
          }}
        >
          Generate Alt Text {isLoading && <Spinner size={24} />}
        </Button>
      )}
    </Canvas>
  );
};

export default AltTextAIButton;
