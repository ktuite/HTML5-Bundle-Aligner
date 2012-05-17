#!/usr/bin/env sh
#
# Copyright 2008 Amazon Technologies, Inc.
# 
# Licensed under the Amazon Software License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at:
# 
# http://aws.amazon.com/asl
# 
# This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
# OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and
# limitations under the License.
 

url=../mturk_launcher

cd ../
cd bin
echo ./loadHITs.sh $1 $2 $3 $4 $5 $6 $7 $8 $9 -label ${url}/external_hit -input ${url}/external_hit.input -question ${url}/external_hit.question -properties ${url}/external_hit.properties 
./loadHITs.sh $1 $2 $3 $4 $5 $6 $7 $8 $9 -label ${url}/external_hit -input ${url}/external_hit.input -question ${url}/external_hit.question -properties ${url}/external_hit.properties 
cd $url
