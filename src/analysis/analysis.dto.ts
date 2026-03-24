import { ApiProperty } from '@nestjs/swagger';

export class ActivityCompleteDto {
  @ApiProperty({ example: 'ccddc1be-4a51-4823-8a10-c499c664ef0f' })
  sessionId: string;

  @ApiProperty({ example: 'the_riddle_gate' })
  activityKey: string;

  @ApiProperty({ example: 'I can burn but I have no fire... The Sun!', required: false })
  transcript?: string;

  @ApiProperty({ example: 'https://...', required: false })
  audioUrl?: string;
}