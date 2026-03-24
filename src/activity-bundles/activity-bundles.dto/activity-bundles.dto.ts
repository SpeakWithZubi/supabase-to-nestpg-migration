import { ApiProperty } from '@nestjs/swagger';

export class CreateActivityBundleDto {
  @ApiProperty({ example: 'ccddc1be-4a51-4823-8a10-c499c664ef0f' })
  sessionId: string;

  @ApiProperty({ example: '603eae81-59c0-4ae6-8b67-60ec57ca0bb2' })
  activityId: string;

  @ApiProperty({ example: 'curiosity_reward' })
  activityKey: string;

  @ApiProperty({ example: '6-9' })
  ageGroupId: string;

  @ApiProperty({ 
    example: { meta: { startedAtMs: 1773666565116 }, turns: [] },
    description: 'The raw JSON output from the frontend game engine'
  })
  bundleJson: any;

  @ApiProperty({ example: 'completed' })
  status: string;

  @ApiProperty({ example: 'https://...', required: false })
  audioUrl?: string;

  @ApiProperty({ example: 'file_id.webm', required: false })
  audioFileId?: string;

  @ApiProperty({ example: 33155, required: false })
  audioDurationMs?: number;

  @ApiProperty({ example: 349484, required: false })
  audioFileSizeBytes?: number;
}